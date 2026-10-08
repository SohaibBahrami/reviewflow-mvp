import { useEffect, useMemo, useRef, useState } from 'react'
import { ClientReview } from './components/ClientReview'
import { Dashboard } from './components/Dashboard'
import { NewProject } from './components/NewProject'
import { Shell } from './components/Shell'
import { VideoReview } from './components/VideoReview'
import { loadProjects, saveProjects } from './lib/storage'
import { getLocalVideo } from './lib/videoStorage'
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

  useEffect(() => {
    applyTheme(theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f6fa' : '#0f1115')
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => saveProjects(projects), [projects])

  const videoUrlsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const hydrateVideos = async () => {
      const updates = await Promise.all(
        projects.map(async (project) => {
          if (!project.localVideoId || videoUrlsRef.current[project.id]) {
            return { id: project.id, url: videoUrlsRef.current[project.id] }
          }

          try {
            const blob = await getLocalVideo(project.localVideoId)
            const url = blob ? URL.createObjectURL(blob) : undefined
            if (url) videoUrlsRef.current[project.id] = url
            return { id: project.id, url }
          } catch {
            return { id: project.id, url: undefined as string | undefined }
          }
        }),
      )

      if (cancelled) return

      setProjects((current) => current.map((project) => {
        const update = updates.find((item) => item.id === project.id)
        if (!update?.url || project.localVideoUrl === update.url) return project
        return { ...project, localVideoUrl: update.url }
      }))
    }

    void hydrateVideos()

    return () => {
      cancelled = true
    }
  }, [projects])

  useEffect(() => () => {
    Object.values(videoUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const project = useMemo(
    () => projects.find((item) => item.id === route.id),
    [projects, route.id],
  )

  const sharedProject = useMemo(
    () => projects.find((item) => item.shareToken === route.id),
    [projects, route.id],
  )

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

  let page: React.ReactNode

  if (route.path === '/review' && project) {
    page = <VideoReview project={project} onBack={() => navigate('/')} onClientPreview={() => navigate(`/client/${project.id}`)} onUpdate={updateProject} />
  } else if (route.path === '/client' && project) {
    page = <ClientReview project={project} onBack={() => navigate(`/review/${project.id}`)} onUpdate={updateProject} />
  } else if (route.path === '/share' && sharedProject) {
    page = <ClientReview project={sharedProject} standalone onUpdate={updateProject} />
  } else if (route.path === '/share') {
    page = <section className="narrow-page"><p className="eyebrow">Review link</p><h1>This review link is no longer available.</h1><p className="hero-copy">Ask the editor for a new link to the current video version.</p></section>
  } else if (route.path === '/new') {
    page = <NewProject onCreate={createProject} />
  } else if (route.path === '/') {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} />
  } else {
    page = <Dashboard projects={projects} onNew={() => navigate('/new')} onOpen={(id) => navigate(`/review/${id}`)} />
  }

  return (
    <Shell
      active={route.path}
      theme={theme}
      clientMode={route.path === '/client' || route.path === '/share'}
      onNavigate={navigate}
      onToggleTheme={() => setTheme((current) => toggleTheme(current))}
    >
      {page}
    </Shell>
  )
}
