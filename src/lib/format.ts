export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const secs = safe % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function relativeDate(iso: string, locale = 'en') {
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return ''
  const diffSeconds = Math.round((time - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  if (Math.abs(diffSeconds) < 45) return formatter.format(0, 'second')
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}
