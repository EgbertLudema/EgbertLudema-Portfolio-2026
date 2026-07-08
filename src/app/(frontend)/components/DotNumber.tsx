const GLYPHS: Record<string, string> = {
  '0': 'XXX X.X X.X X.X XXX',
  '1': '.X. XX. .X. .X. XXX',
  '2': 'XXX ..X XXX X.. XXX',
  '3': 'XXX ..X XXX ..X XXX',
  '4': 'X.X X.X XXX ..X ..X',
  '5': 'XXX X.. XXX ..X XXX',
  '6': 'XXX X.. XXX X.X XXX',
  '7': 'XXX ..X ..X ..X ..X',
  '8': 'XXX X.X XXX X.X XXX',
  '9': 'XXX X.X XXX ..X XXX',
  '+': '... .X. XXX .X. ...',
  '%': 'X.X ..X .X. X.. X.X',
  '.': '... ... ... ... .X.',
}

export function DotNumber({
  value,
  dot = 6,
  gap = 2,
  className = '',
}: {
  value: string
  dot?: number
  gap?: number
  className?: string
}) {
  const chars = value.split('')

  return (
    <span
      className={`dot-number ${className}`}
      style={{ gap: gap * 2.4 }}
      role="img"
      aria-label={value}
    >
      {chars.map((char, i) => {
        const pattern = GLYPHS[char]
        if (!pattern) return null
        const rows = pattern.split(' ')

        return (
          <span
            key={i}
            className="dot-number__glyph"
            style={{ gridTemplateColumns: `repeat(3, ${dot}px)`, gap }}
          >
            {rows.flatMap((row, r) =>
              row.split('').map((cell, c) => (
                <span
                  key={`${r}-${c}`}
                  className="dot-number__cell"
                  data-on={cell === 'X'}
                  style={{ width: dot, height: dot }}
                />
              )),
            )}
          </span>
        )
      })}
    </span>
  )
}
