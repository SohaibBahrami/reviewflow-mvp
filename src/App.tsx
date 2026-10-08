import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ClientReview } from './components/ClientReview'
import { AuthView } from './components/AuthView'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Dashboard } from './components/Dashboard'
import { NewProject } from './components/NewProject'
import { Shell } from './components/Shell'
import { Trash } from './components/Trash'
import { VideoReview } from './components/VideoReview'
import { loadProjects, saveProjects } from './lib/storage'
import { deleteLocalVideo, getLocalVideo } from './lib/videoStorage'
import { applyTheme, getTheme, toggleTheme, type Theme } from './lib/theme'
import type { Project } from './lib/types'

function getRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, id] = raw.split('/').filter(Boolean)
  if (!path) return { path: '/', id: undefined }
  return { path: `/${path}`, id }
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [projects, setProjects] = useState<Project[]>(loadProjects)
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
    const result = saveProjects(projects)
    if (!result.ok) setNotice(result.message ?? 'Your changes could not be saved.')
  }, [projects])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('ReviewFlow browser error', event.error ?? event.message)
      setNotice('Something went wrong in the page. Your saved projects are kept locally; reload if the page becomes unresponsive.')
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('ReviewFlow unhandled promise rejection', event.reason)
      setNotice('Something went wrong while completing that action. Please try again.')
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

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

  const videoUrlsRef = useRef<Record<string, string>>({})
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

    const cachedUrl = videoUrlsRef.current[target.id]
    if (cachedUrl) {
      if (target.localVideoUrl !== cachedUrl) {
        setProjects((current) => current.map((item) => (
          item.id === target.id ? { ...item, localVideoUrl: cachedUrl } : item
        )))
      }
      return
    }

    if (hydratedVideoIdsRef.current.has(target.localVideoId)) return
    hydratedVideoIdsRef.current.add(target.localVideoId)

    const hydrateActiveVideo = async () => {
      try {
        const blob = await getLocalVideo(target.localVideoId!)
        if (cancelled) return
        if (!blob) {
          setNotice('A saved video could not be found. Try re-uploading the video in this project.')
          return
        }

        const url = URL.createObjectURL(blob)
        videoUrlsRef.current[target.id] = url
        setProjects((current) => current.map((item) => (
          item.id === target.id ? { ...item, localVideoUrl: url } : item
        )))
      } catch (error) {
        console.error('ReviewFlow could not restore local video.', error)
        if (!cancelled) setNotice('A saved video could not be loaded. Try re-uploading the video in this project.')
      }
    }

    void hydrateActiveVideo()

    return () => {
      cancelled = true
    }
  }, [activeVideoProject?.id, activeVideoProject?.localVideoId, activeVideoProject?.localVideoUrl])

  useEffect(() => () => {
    Object.values(videoUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
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
    if (!projects.some((item) => item.id === id)) return
    setDeleteTargetId(id)
  }

  function moveProjectToTrash() {
    const id = deleteTargetId
    if (!id) return

    const target = projects.find((item) => item.id === id)
    if (!target) {
      setDeleteTargetId(null)
      return
    }

    if (videoUrlsRef.current[id]) {
      URL.revokeObjectURL(videoUrlsRef.current[id])
      delete videoUrlsRef.current[id]
    }

    setProjects((current) => current.map((item) => (
      item.id === id
        ? {
            ...item,
            status: 'trashed',
            statusBeforeTrash: target.status === 'trashed' ? 'in_review' : target.status,
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

    if (videoUrlsRef.current[id]) {
      URL.revokeObjectURL(videoUrlsRef.current[id])
      delete videoUrlsRef.current[id]
    }

    let videoDeleteFailed = false
    if (target.localVideoId) {
      try {
        await deleteLocalVideo(target.localVideoId)
      } catch (error) {
        videoDeleteFailed = true
        console.error('ReviewFlow could not permanently delete the local video.', error)
      }
    }

    setProjects((current) => current.filter((item) => item.id !== id))
    setPermanentDeleteTargetId(null)
    if (undoDeleteId === id) {
      setUndoDeleteId(null)
      setUndoDeadline(null)
    }

    if (videoDeleteFailed) {
      setNotice('The project was removed, but its local video could not be deleted from browser storage.')
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
    page = <section className="narrow-page"><p className="eyebrow">Review link</p><h1>This review link is no longer available.</h1><p className="hero-copy">Ask the editor for a new link to the current video version.</p></section>
  } else if (route.path === '/new') {
    page = <NewProject onCreate={createProject} />
  } else if (route.path === '/') {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onDelete={requestDeleteProject} onToggleComplete={toggleProjectComplete} />
  } else {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onDelete={requestDeleteProject} onToggleComplete={toggleProjectComplete} />
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
            <button type="button" onClick={() => setNotice(null)}>Dismiss</button>
          </div>
        </div>
      )}
      {page}
      {undoDeleteId && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>Project moved to Trash.</span>
          {undoSeconds > 0 && (
            <button type="button" onClick={undoDelete}>Undo <strong>{undoSeconds}s</strong></button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={deleteTargetId ? `Move “${projects.find((item) => item.id === deleteTargetId)?.title ?? 'this project'}” to Trash?` : ''}
        description="The project will leave your active work, but you can restore it from Trash. Its saved video will stay there until you permanently delete the project."
        confirmLabel="Move to Trash"
        onConfirm={moveProjectToTrash}
        onCancel={() => setDeleteTargetId(null)}
      />
      <ConfirmDialog
        open={Boolean(permanentDeleteTargetId)}
        title={permanentDeleteTargetId ? `Delete “${projects.find((item) => item.id === permanentDeleteTargetId)?.title ?? 'this project'}” forever?` : ''}
        description="This permanently removes the project and its saved local video from this browser. There is no undo after this."
        confirmLabel="Delete forever"
        danger
        onConfirm={() => void permanentlyDeleteProject()}
        onCancel={() => setPermanentDeleteTargetId(null)}
      />
    </Shell>
  )
}
