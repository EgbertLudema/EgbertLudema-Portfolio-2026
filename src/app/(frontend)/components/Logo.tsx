import type { CSSProperties } from 'react'

export function Logo({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <span className={`logo ${className}`} style={style} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="12" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.4" />
        <circle cx="13" cy="13" r="5.5" fill="currentColor" />
      </svg>
    </span>
  )
}
