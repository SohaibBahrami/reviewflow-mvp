interface Props {
  onNavigate?: () => void
}

export function Logo({ onNavigate }: Props) {
  return (
    <a
      className="brand"
      href="#/"
      onClick={(event) => {
        event.preventDefault()
        onNavigate?.()
      }}
      aria-label="ReviewFlow home"
    >
      <img className="brand-mark" src="/reviewflow-mark.svg" alt="" aria-hidden="true" />
      <span>ReviewFlow</span>
    </a>
  )
}
