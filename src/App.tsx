import { useEffect, useMemo, useRef, useState } from 'react'
import { ClientReview } from './components/ClientReview'
import { Dashboard } from './components/Dashboard'
import { NewProject } from './components/NewProject'
import { Shell } from './components/Shell'
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

  const videoUrlsRef = useRef<Record<string, string>>({})
  const hydratedVideoIdsRef = useRef<Set<string>>(new Set())

  const project = useMemo(
    () => projects.find((item) => item.id === route.id),
    [projects, route.id],
  )

  const sharedProject = useMemo(
    () => projects.find((item) => item.shareToken === route.id),
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

  async function deleteProject(id: string) {
    const target = projects.find((item) => item.id === id)
    if (!target) return

    if (!window.confirm(`Delete “${target.title}”? This cannot be undone.`)) return

    if (videoUrlsRef.current[id]) {
      URL.revokeObjectURL(videoUrlsRef.current[id])
      delete videoUrlsRef.current[id]
    }

    if (target.localVideoId) {
      try {
        await deleteLocalVideo(target.localVideoId)
      } catch (error) {
        console.error('ReviewFlow could not delete the local video.', error)
        setNotice('The project was deleted, but its local video could not be removed from browser storage.')
      }
    }

    setProjects((current) => current.filter((item) => item.id !== id))
    navigate('/')
  }

  function toggleProjectComplete(id: string) {
    setProjects((current) => current.map((item) => {
      if (item.id !== id) return item
      if (item.status === 'completed') return { ...item, status: 'in_review', completedAt: undefined }
      return { ...item, status: 'completed', completedAt: new Date().toISOString() }
    }))
  }

  let page: React.ReactNode

  if (route.path === '/review' && project) {
    page = <VideoReview project={project} onBack={() => navigate('/')} onClientPreview={() => navigate(`/client/${project.id}`)} onUpdate={updateProject} onDelete={() => void deleteProject(project.id)} onToggleComplete={() => toggleProjectComplete(project.id)} />
  } else if (route.path === '/client' && project) {
    page = <ClientReview project={project} onBack={() => navigate(`/review/${project.id}`)} onUpdate={updateProject} />
  } else if (route.path === '/share' && sharedProject) {
    page = <ClientReview project={sharedProject} standalone onUpdate={updateProject} />
  } else if (route.path === '/share') {
    page = <section className="narrow-page"><p className="eyebrow">Review link</p><h1>This review link is no longer available.</h1><p className="hero-copy">Ask the editor for a new link to the current video version.</p></section>
  } else if (route.path === '/new') {
    page = <NewProject onCreate={createProject} />
  } else if (route.path === '/') {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onDelete={(id) => void deleteProject(id)} onToggleComplete={toggleProjectComplete} />
  } else {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} onDelete={(id) => void deleteProject(id)} onToggleComplete={toggleProjectComplete} />
  }

  return (
    <Shell
      active={route.path}
      theme={theme}
      clientMode={route.path === '/client' || route.path === '/share'}
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
    </Shell>
  )
}
