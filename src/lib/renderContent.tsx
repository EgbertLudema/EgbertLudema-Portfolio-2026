import { Fragment } from 'react'

import styles from '@/app/(frontend)/PageShell.module.css'

const HEADING_COLOR_CLASSES: Record<string, string> = {
  purple: styles.headingPurple,
  orange: styles.headingOrange,
  yellow: styles.headingYellow,
  green: styles.headingGreen,
}

/** Splits a plain-text `content` field into heading/paragraph/list blocks on
 * blank lines:
 * - A block that is a single line starting with "## " renders as a section
 *   heading. Tag it with a trailing "{color}" (purple/orange/yellow/green)
 *   to mark which part of a model/framework it belongs to, e.g.
 *   "## Intensie {purple}".
 * - A block that is a single line starting with "### " renders as a
 *   smaller, uncolored sub-heading.
 * - A block where every line starts with "- " renders as a bullet list.
 * - Anything else renders as a paragraph with line breaks preserved. */
export function renderContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 1) {
      const subheadingMatch = lines[0].match(/^###\s+(.+)$/)
      if (subheadingMatch) {
        return (
          <h3 className={styles.subheading} key={blockIndex}>
            {subheadingMatch[1]}
          </h3>
        )
      }

      const headingMatch = lines[0].match(/^##\s+(.+)$/)
      if (headingMatch) {
        let text = headingMatch[1]
        let colorClass = ''
        const colorMatch = text.match(/\s*\{(\w+)\}\s*$/)
        if (colorMatch) {
          text = text.slice(0, colorMatch.index).trim()
          colorClass = HEADING_COLOR_CLASSES[colorMatch[1].toLowerCase()] ?? ''
        }
        return (
          <h2 className={`${styles.heading} ${colorClass}`} key={blockIndex}>
            {text}
          </h2>
        )
      }
    }

    const isList = lines.length > 0 && lines.every((line) => line.startsWith('- '))

    if (isList) {
      return (
        <ul className={styles.listBlock} key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{line.replace(/^- /, '')}</li>
          ))}
        </ul>
      )
    }

    return (
      <p className={styles.paragraph} key={blockIndex}>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    )
  })
}
