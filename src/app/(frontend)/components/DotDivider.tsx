const PATTERN = [0.9, 0.35, 0.6, 0.2, 1, 0.4, 0.7, 0.25, 0.5, 0.85, 0.3, 0.65, 0.2, 0.95, 0.45]

export function DotDivider({ className = '' }: { className?: string }) {
  return (
    <span className={`dot-divider ${className}`} aria-hidden="true">
      {PATTERN.map((o, i) => (
        <span
          key={i}
          className="dot-divider__dot"
          style={{ opacity: o, transform: `scale(${0.5 + o * 0.6})` }}
        />
      ))}
    </span>
  )
}
