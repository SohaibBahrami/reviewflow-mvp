type Props = {
  locale: 'en' | 'fr' | 'es' | 'de' | 'pt'
}

const svgProps = {
  viewBox: '0 0 30 20',
  className: 'language-flag',
  'aria-hidden': true as const,
  focusable: 'false' as const,
}

export function LanguageFlag({ locale }: Props) {
  switch (locale) {
    case 'en':
      return (
        <svg {...svgProps}>
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="5" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="2" />
          <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="8" />
          <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="4" />
        </svg>
      )
    case 'fr':
      return (
        <svg {...svgProps}>
          <rect width="10" height="20" fill="#002395" />
          <rect x="10" width="10" height="20" fill="#fff" />
          <rect x="20" width="10" height="20" fill="#ED2939" />
        </svg>
      )
    case 'es':
      return (
        <svg {...svgProps}>
          <rect width="30" height="5" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
          <rect y="15" width="30" height="5" fill="#AA151B" />
        </svg>
      )
    case 'de':
      return (
        <svg {...svgProps}>
          <rect width="30" height="6.67" fill="#000" />
          <rect y="6.67" width="30" height="6.66" fill="#D00" />
          <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
        </svg>
      )
    case 'pt':
      return (
        <svg {...svgProps}>
          <rect width="12" height="20" fill="#046A38" />
          <rect x="12" width="18" height="20" fill="#DA291C" />
          <circle cx="12" cy="10" r="3.1" fill="#FFCD00" stroke="#fff" strokeWidth="0.5" />
        </svg>
      )
    default:
      return null
  }
}
