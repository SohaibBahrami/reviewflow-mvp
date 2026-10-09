import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

function ErrorFallback({ message, onReload }: { message?: string; onReload: () => void }) {
  const { t } = useI18n()
  return (
    <main className="error-page">
      <div className="error-card">
        <p className="eyebrow">{t('Something went wrong')}</p>
        <h1>{t("ReviewFlow couldn't load this page.")}</h1>
        <p className="hero-copy">{t('Your saved projects should still be in this browser. Reload the page and try again.')}</p>
        {message && <details className="error-details"><summary>{t('Technical details')}</summary><code>{message}</code></details>}
        <button className="button button-primary" onClick={onReload}>{t('Reload ReviewFlow')}</button>
      </div>
    </main>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'ReviewFlow ran into an unexpected problem.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ReviewFlow render error', error, info)
  }

  handleReload = () => window.location.reload()

  render() {
    return this.state.hasError ? <ErrorFallback message={this.state.message} onReload={this.handleReload} /> : this.props.children
  }
}
