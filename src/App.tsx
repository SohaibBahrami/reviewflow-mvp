import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ClientReview } from './components/ClientReview'
import { AuthView } from './components/AuthView'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Dashboard } from './components/Dashboard'
import { NewProject } from './components/NewProject'
import { Shell } from './components/Shell'
import { Trash } from './components/Trash'
import { VideoReview } from './components/VideoReview'
import { getLocalDataOwner, getUserProjectsStorageKey, loadCloudSyncBaseline, loadProjects, saveCloudSyncBaseline, saveProjects, setLocalDataOwner } from './lib/storage'
import { getSupabaseClient } from './lib/supabase'
import { deleteCloudProject, loadCloudProjects, saveCloudProject } from './lib/cloudProjectStore'
import { cloudRowToProject, normalizeProjectForCloud, projectPayloadSignature, projectToCloudPayload } from './lib/cloudProjectCore.js'
import { deleteLocalVideos, getLocalVideo } from './lib/videoStorage'
import { applyTheme, getTheme, toggleTheme, type Theme } from './lib/theme'
import type { Project } from './lib/types'
import { canMoveProjectToTrash, countTrashedProjects, getProjectVideoIds, MAX_TRASH_PROJECTS } from './lib/projectRules'
import { useI18n } from './lib/i18n'

function getRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, id] = raw.split('/').filter(Boolean)
  if (!path) return { path: '/', id: undefined }
  return { path: `/${path}`, id }
}

export default function App() {
  const { t } = useI18n()
  const [route, setRoute] = useState(getRoute)
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [cloudUserId, setCloudUserId] = useState<string | null>(null)
  const [cloudDataOwnerId, setCloudDataOwnerId] = useState<string | null>(null)
  const [cloudSyncReady, setCloudSyncReady] = useState(false)
  const cloudSaveRevisionRef = useRef(0)
  const cloudSaveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const lastCloudSignatureRef = useRef<string | null>(null)
  const knownCloudProjectIdsRef = useRef<Set<string>>(new Set())
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  const [notice, setNotice] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState<string | null>(null)
  const [undoDeleteId, setUndoDeleteId] = useState<string | null>(null)
  const [undoDeadline, setUndoDeadline] = useState<number | null>(null)
  const [undoSeconds, setUndoSeconds] = useState(0)

  useEffect(() => {
    applyTheme(theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f6fa' : '#0f1115')
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    void getSupabaseClient()
      .then(async (client) => {
        if (!mounted || !client) return
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        if (!mounted) return
        setCloudUserId(data.session?.user.id ?? null)

        const authState = client.auth.onAuthStateChange((_event, session) => {
          if (mounted) setCloudUserId(session?.user.id ?? null)
        })
        subscription = authState.data.subscription
      })
      .catch((error) => {
        console.error('ReviewFlow could not initialize cloud project sync.', error)
        if (mounted) setNotice(t('We could not connect your account service. Check your connection and try again.'))
      })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    const userId = cloudUserId

    setCloudSyncReady(false)
    lastCloudSignatureRef.current = null
    knownCloudProjectIdsRef.current.clear()

    if (!userId) {
      setCloudDataOwnerId(null)
      setProjects(loadProjects())
      return () => { cancelled = true }
    }

    const storageKey = getUserProjectsStorageKey(userId)
    const previousBaseline = loadCloudSyncBaseline(userId)
    setCloudDataOwnerId(null)
    setProjects(loadProjects(storageKey, false))
    const accountCache = loadProjects(storageKey, false)
    const previousLocalOwner = getLocalDataOwner()
    // The shared local-only store is imported only on the first claim. Importing
    // it again for the same account after each sign-in would duplicate legacy IDs.
    const mayImportLegacyLocal = !previousLocalOwner
    const legacyLocal = mayImportLegacyLocal ? loadProjects() : []
    if (mayImportLegacyLocal) setLocalDataOwner(userId)

    const candidatesById = new Map<string, Project>()
    accountCache.forEach((project) => candidatesById.set(project.id, project))
    legacyLocal.forEach((project) => {
      if (!candidatesById.has(project.id)) candidatesById.set(project.id, project)
    })
    const candidateEntries = [...candidatesById.values()].map((original) => ({
      original,
      normalized: normalizeProjectForCloud(original),
    }))
    let localCandidates = candidateEntries.map(({ normalized }) => normalized)
    let foundCloudConflict = false

    const restoreLocalFallback = () => {
      if (cancelled) return
      setProjects(localCandidates)
      setCloudDataOwnerId(userId)
      setCloudSyncReady(false)
      const result = saveProjects(localCandidates, storageKey)
      if (!result.ok) setNotice(t('Your changes could not be saved.'))
    }

    async function initializeCloudProjects() {
      try {
        const client = await getSupabaseClient()
        if (!client) {
          restoreLocalFallback()
          return
        }

        const { data: sessionData, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (sessionData.session?.user.id !== userId) return

        const remoteRows = await loadCloudProjects(client, userId)
        const remoteById = new Map(remoteRows.map((row) => [row.id, row]))
        const merged: Project[] = []
        const migratedIds = new Set<string>()

        for (const localProject of localCandidates) {
          if (cancelled) return
          const remote = remoteById.get(localProject.id)
          const baselineSignature = previousBaseline[localProject.id]
          const localSignature = projectPayloadSignature(localProject)

          if (remote) {
            const remoteProject = cloudRowToProject(remote as unknown as Record<string, any>, localProject)
            const remoteSignature = projectPayloadSignature(remoteProject)

            if (baselineSignature && localSignature !== baselineSignature) {
              if (remoteSignature !== baselineSignature && remoteSignature !== localSignature) {
                foundCloudConflict = true
              }
              // A local edit made since the last successful sync wins, avoiding
              // silent loss of work edited while offline.
              await saveCloudProject(client, localProject)
              merged.push(localProject)
            } else {
              // No known local edits: the remote project is the source of truth,
              // while matching version-specific IndexedDB refs are kept locally.
              merged.push(remoteProject)
            }
            migratedIds.add(localProject.id)
          } else if (baselineSignature && localSignature === baselineSignature) {
            // A project that was previously synced but disappeared remotely was
            // deleted on another device. Do not resurrect an unchanged stale cache.
            migratedIds.add(localProject.id)
          } else {
            if (baselineSignature && localSignature !== baselineSignature) foundCloudConflict = true
            // New project, or a project edited locally after a remote deletion.
            await saveCloudProject(client, localProject)
            merged.push(localProject)
            migratedIds.add(localProject.id)
          }
        }

        for (const remote of remoteRows) {
          if (migratedIds.has(remote.id)) continue

          if (previousBaseline[remote.id] && !candidatesById.has(remote.id)) {
            // Locally deleted from this browser after its last sync; propagate the
            // deletion instead of bringing the same project back from the cloud.
            await deleteCloudProject(client, remote.id)
            continue
          }
          merged.push(cloudRowToProject(remote as unknown as Record<string, any>))
        }

        const routeProject = candidateEntries.find(({ original }) => original.id === route.id)
        if (route.id && routeProject && routeProject.original.id !== routeProject.normalized.id) {
          const routeName = route.path === '/client' ? 'client' : 'review'
          if (route.path === '/client' || route.path === '/review') {
            window.location.hash = `#/${routeName}/${routeProject.normalized.id}`
          }
        }

        if (cancelled) return
        localCandidates = merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        lastCloudSignatureRef.current = JSON.stringify(
          [...localCandidates].sort((a, b) => a.id.localeCompare(b.id)).map(projectToCloudPayload),
        )
        knownCloudProjectIdsRef.current = new Set(localCandidates.map((project) => project.id))
        const baselineResult = saveCloudSyncBaseline(userId, Object.fromEntries(
          localCandidates.map((project) => [project.id, projectPayloadSignature(project)]),
        ))
        setProjects(localCandidates)
        setCloudDataOwnerId(userId)
        setCloudSyncReady(true)
        if (foundCloudConflict) {
          setNotice(t('There were changes on both devices. ReviewFlow kept your local changes and synced them to your account.'))
        } else if (!baselineResult.ok) {
          setNotice(t('Cloud sync history could not be saved in this browser.'))
        }
      } catch (error) {
        console.error('ReviewFlow could not load or migrate cloud projects.', error)
        restoreLocalFallback()
        setNotice(t('We could not connect your account service. Check your connection and try again.'))
      }
    }

    void initializeCloudProjects()
    return () => { cancelled = true }
  }, [cloudUserId])

  useEffect(() => {
    if (cloudUserId) {
      if (cloudDataOwnerId !== cloudUserId) return
      const result = saveProjects(projects, getUserProjectsStorageKey(cloudUserId))
      if (!result.ok) setNotice(t('Your changes could not be saved.'))
      return
    }

    // During sign-out, never copy the previous account's cloud projects into
    // the browser's shared local-only cache.
    if (cloudDataOwnerId !== null) return
    const result = saveProjects(projects)
    if (!result.ok) setNotice(t('Your changes could not be saved.'))
  }, [projects, cloudUserId, cloudDataOwnerId, t])

  const cloudProjectSignature = useMemo(
    () => JSON.stringify([...projects].sort((a, b) => a.id.localeCompare(b.id)).map(projectToCloudPayload)),
    [projects],
  )

  useEffect(() => {
    if (!cloudUserId || cloudDataOwnerId !== cloudUserId || !cloudSyncReady) return
    if (cloudProjectSignature === lastCloudSignatureRef.current) return

    const signature = cloudProjectSignature
    const snapshot = projects.map((project) => normalizeProjectForCloud(project))
    const timer = window.setTimeout(() => {
      const revision = ++cloudSaveRevisionRef.current
      cloudSaveQueueRef.current = cloudSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (revision !== cloudSaveRevisionRef.current) return
          const client = await getSupabaseClient()
          if (!client) throw new Error('Supabase is not configured.')
          const { data, error } = await client.auth.getSession()
          if (error) throw error
          if (data.session?.user.id !== cloudUserId) return

          for (const project of snapshot) {
            if (revision !== cloudSaveRevisionRef.current) return
            await saveCloudProject(client, project)
          }

          if (revision === cloudSaveRevisionRef.current) lastCloudSignatureRef.current = signature
        })
        .catch((error) => {
          console.error('ReviewFlow cloud project sync failed.', error)
          if (revision === cloudSaveRevisionRef.current) setNotice(t('We could not connect your account service. Check your connection and try again.'))
        })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [cloudProjectSignature, cloudUserId, cloudDataOwnerId, cloudSyncReady, projects, t])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('ReviewFlow browser error', event.error ?? event.message)
      setNotice(t('Something went wrong in the page. Your saved projects are kept locally; reload if the page becomes unresponsive.'))
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('ReviewFlow unhandled promise rejection', event.reason)
      setNotice(t('Something went wrong while completing that action. Please try again.'))
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [t])

  useEffect(() => {
    if (!undoDeadline || !undoDeleteId) return

    const update = () => {
      const remaining = Math.max(0, undoDeadline - Date.now())
      setUndoSeconds(Math.ceil(remaining / 1000))
      if (remaining <= 0) {
        setUndoDeleteId(null)
        setUndoDeadline(null)
      }
    }

    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [undoDeadline, undoDeleteId])

  useEffect(() => {
    if (!deleteTargetId && !permanentDeleteTargetId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDeleteTargetId(null)
        setPermanentDeleteTargetId(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteTargetId, permanentDeleteTargetId])

  const videoUrlsRef = useRef<Record<string, { videoId: string; url: string }>>({})
  const hydratedVideoIdsRef = useRef<Set<string>>(new Set())

  const project = useMemo(
    () => projects.find((item) => item.id === route.id),
    [projects, route.id],
  )

  const sharedProject = useMemo(
    () => projects.find((item) => item.shareToken === route.id && item.status !== 'trashed'),
    [projects, route.id],
  )

  const activeVideoProject =
    route.path === '/review' || route.path === '/client'
      ? project
      : route.path === '/share'
        ? sharedProject
        : undefined

  useEffect(() => {
    let cancelled = false
    const target = activeVideoProject

    if (!target?.localVideoId) return

    const videoId = target.localVideoId
    const cachedVideo = videoUrlsRef.current[target.id]
    if (cachedVideo?.videoId === videoId) {
      if (target.localVideoUrl !== cachedVideo.url) {
        setProjects((current) => current.map((item) => (
          item.id === target.id && item.localVideoId === videoId
            ? { ...item, localVideoUrl: cachedVideo.url }
            : item
        )))
      }
      return
    }

    if (cachedVideo) {
      URL.revokeObjectURL(cachedVideo.url)
      delete videoUrlsRef.current[target.id]
    }

    if (hydratedVideoIdsRef.current.has(videoId)) return
    hydratedVideoIdsRef.current.add(videoId)

    const hydrateActiveVideo = async () => {
      try {
        const blob = await getLocalVideo(videoId)
        if (cancelled) {
          hydratedVideoIdsRef.current.delete(videoId)
          return
        }
        if (!blob) {
          hydratedVideoIdsRef.current.delete(videoId)
          setNotice(t('A saved video could not be found. Try re-uploading the video in this project.'))
          return
        }

        const url = URL.createObjectURL(blob)
        videoUrlsRef.current[target.id] = { videoId, url }
        setProjects((current) => current.map((item) => (
          item.id === target.id && item.localVideoId === videoId
            ? { ...item, localVideoUrl: url }
            : item
        )))
      } catch (error) {
        hydratedVideoIdsRef.current.delete(videoId)
        console.error('ReviewFlow could not restore local video.', error)
        if (!cancelled) setNotice(t('A saved video could not be loaded. Try reopening the project or re-uploading the video.'))
      }
    }

    void hydrateActiveVideo()

    return () => {
      cancelled = true
    }
  }, [activeVideoProject?.id, activeVideoProject?.localVideoId, activeVideoProject?.localVideoUrl])

  useEffect(() => () => {
    Object.values(videoUrlsRef.current).forEach(({ url }) => URL.revokeObjectURL(url))
  }, [])

  function navigate(path: string) {
    window.location.hash = path
  }

  function createProject(next: Project) {
    setProjects((current) => [next, ...current])
    navigate(`/review/${next.id}`)
  }

  function updateProject(next: Project) {
    setProjects((current) => current.map((item) => (item.id === next.id ? next : item)))
  }

  function requestDeleteProject(id: string) {
    const target = projects.find((item) => item.id === id && item.status !== 'trashed')
    if (!target) return

    if (!canMoveProjectToTrash(projects, id)) {
      setNotice(t('Trash is full ({count}/{max}). Restore a project or permanently delete one in Trash before deleting another.', { count: countTrashedProjects(projects), max: MAX_TRASH_PROJECTS }))
      navigate('/trash')
      return
    }

    setNotice(null)
    setDeleteTargetId(id)
  }

  function moveProjectToTrash() {
    const id = deleteTargetId
    if (!id) return

    const target = projects.find((item) => item.id === id)
    if (!target || target.status === 'trashed') {
      setDeleteTargetId(null)
      return
    }

    // Recheck at confirmation time too, so the three-item limit cannot be bypassed.
    if (!canMoveProjectToTrash(projects, id)) {
      setDeleteTargetId(null)
      setNotice(t('Trash is full ({count}/{max}). Restore a project or permanently delete one in Trash before deleting another.', { count: countTrashedProjects(projects), max: MAX_TRASH_PROJECTS }))
      navigate('/trash')
      return
    }

    // Capture the previous non-trash status before entering the state updater.
    // The statusBeforeTrash field deliberately excludes 'trashed'; mapping explicitly
    // also protects this invariant if data is stale or corrupted.
    const statusBeforeTrash: NonNullable<Project['statusBeforeTrash']> =
      target.status === 'completed'
        ? 'completed'
        : target.status === 'approved'
          ? 'approved'
          : 'in_review'

    // Keep the object URL alive while the project is in Trash. Undo/Restore should
    // return the project with a working player; revoke only on permanent deletion.
    setProjects((current) => current.map((item) => (
      item.id === id
        ? {
            ...item,
            status: 'trashed',
            statusBeforeTrash,
            trashedAt: new Date().toISOString(),
          }
        : item
    )))

    setDeleteTargetId(null)
    setUndoDeleteId(id)
    setUndoDeadline(Date.now() + 8000)
    setUndoSeconds(8)

    if (route.id === id && route.path !== '/trash') navigate('/')
  }

  function undoDelete() {
    const id = undoDeleteId
    if (!id) return

    setProjects((current) => current.map((item) => {
      if (item.id !== id) return item
      const restoredStatus = item.statusBeforeTrash ?? 'in_review'
      const { statusBeforeTrash: _statusBeforeTrash, trashedAt: _trashedAt, ...rest } = item
      return { ...rest, status: restoredStatus }
    }))
    setUndoDeleteId(null)
    setUndoDeadline(null)
  }

  function requestPermanentDelete(id: string) {
    if (!projects.some((item) => item.id === id && item.status === 'trashed')) return
    setPermanentDeleteTargetId(id)
  }

  async function permanentlyDeleteProject() {
    const id = permanentDeleteTargetId
    if (!id) return

    const target = projects.find((item) => item.id === id)
    if (!target) {
      setPermanentDeleteTargetId(null)
      return
    }

    try {
      await deleteLocalVideos(getProjectVideoIds(target))
    } catch (error) {
      console.error('ReviewFlow could not permanently delete the project videos.', error)
      // Keep the trashed project and all video metadata visible so the user can retry.
      setPermanentDeleteTargetId(null)
      setNotice(t('The video could not be deleted from browser storage. The project is still in Trash; please try again.'))
      return
    }

    const cachedVideo = videoUrlsRef.current[id]
    if (cachedVideo) {
      URL.revokeObjectURL(cachedVideo.url)
      delete videoUrlsRef.current[id]
    }

    setProjects((current) => current.filter((item) => item.id !== id))
    setPermanentDeleteTargetId(null)
    if (undoDeleteId === id) {
      setUndoDeleteId(null)
      setUndoDeadline(null)
    }
  }

  function restoreProject(id: string) {
    setProjects((current) => current.map((item) => {
      if (item.id !== id) return item
      const restoredStatus = item.statusBeforeTrash ?? 'in_review'
      const { statusBeforeTrash: _statusBeforeTrash, trashedAt: _trashedAt, ...rest } = item
      return { ...rest, status: restoredStatus }
    }))
  }

  function toggleProjectComplete(id: string) {
    setProjects((current) => current.map((item) => {
      if (item.id !== id) return item
      if (item.status === 'completed') return { ...item, status: 'in_review', completedAt: undefined }
      return { ...item, status: 'completed', completedAt: new Date().toISOString() }
    }))
  }

  let page: ReactNode

  if (route.path === '/review' && project && project.status !== 'trashed') {
    page = <VideoReview project={project} onBack={() => navigate('/')} onClientPreview={() => navigate(`/client/${project.id}`)} onUpdate={updateProject} onDelete={() => requestDeleteProject(project.id)} onToggleComplete={() => toggleProjectComplete(project.id)} />
  } else if (route.path === '/client' && project && project.status !== 'trashed') {
    page = <ClientReview project={project} onBack={() => navigate(`/review/${project.id}`)} onUpdate={updateProject} />
  } else if (route.path === '/share' && sharedProject) {
    page = <ClientReview project={sharedProject} standalone onUpdate={updateProject} />
  } else if (route.path === '/account') {
    page = <AuthView onDone={() => navigate('/')} />
  } else if (route.path === '/trash') {
    page = <Trash projects={projects} onBack={() => navigate('/')} onRestore={restoreProject} onDeletePermanently={requestPermanentDelete} />
  } else if (route.path === '/share') {
    page = <section className="narrow-page"><p className="eyebrow">{t('Review link')}</p><h1>{t('This review link is no longer available.')}</h1><p className="hero-copy">{t('Ask the editor for a new link to the current video version.')}</p></section>
  } else if (route.path === '/new') {
    page = <NewProject onCreate={createProject} />
  } else if (route.path === '/') {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onToggleComplete={toggleProjectComplete} />
  } else {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onToggleComplete={toggleProjectComplete} />
  }

  return (
    <Shell
      active={route.path}
      theme={theme}
      clientMode={route.path === '/client' || route.path === '/share'}
      trashCount={projects.filter((item) => item.status === 'trashed').length}
      onNavigate={navigate}
      onToggleTheme={() => setTheme((current) => toggleTheme(current))}
    >
      {notice && (
        <div className="app-notice" role="status">
          <div className="app-notice-inner">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)}>{t('Dismiss')}</button>
          </div>
        </div>
      )}
      {page}
      {undoDeleteId && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>{t('Project moved to Trash.')}</span>
          {undoSeconds > 0 && (
            <button type="button" onClick={undoDelete}>{t('Undo')} <strong>{undoSeconds}s</strong></button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={deleteTargetId ? t('Move “{title}” to Trash?', { title: projects.find((item) => item.id === deleteTargetId)?.title ?? 'this project' }) : ''}
        description={t('The project will leave your active work, but you can restore it from Trash. Its saved video will stay there until you permanently delete the project.')}
        confirmLabel={t('Move to Trash')}
        onConfirm={moveProjectToTrash}
        onCancel={() => setDeleteTargetId(null)}
      />
      <ConfirmDialog
        open={Boolean(permanentDeleteTargetId)}
        title={permanentDeleteTargetId ? t('Delete “{title}” forever?', { title: projects.find((item) => item.id === permanentDeleteTargetId)?.title ?? 'this project' }) : ''}
        description={t('This permanently removes the project and its saved local video from this browser. There is no undo after this.')}
        confirmLabel={t('Delete forever')}
        danger
        onConfirm={() => void permanentlyDeleteProject()}
        onCancel={() => setPermanentDeleteTargetId(null)}
      />
    </Shell>
  )
}
