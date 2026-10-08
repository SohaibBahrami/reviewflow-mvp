import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'ReviewFlow ran into an unexpected problem.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ReviewFlow render error', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="error-page">
        <div className="error-card">
          <p className="eyebrow">Something went wrong</p>
          <h1>ReviewFlow couldn't load this page.</h1>
          <p className="hero-copy">
            Your saved projects should still be in this browser. Reload the page and try again.
          </p>
          {this.state.message && <details className="error-details"><summary>Technical details</summary><code>{this.state.message}</code></details>}
          <button className="button button-primary" onClick={this.handleReload}>Reload ReviewFlow</button>
        </div>
      </main>
    )
  }
}
