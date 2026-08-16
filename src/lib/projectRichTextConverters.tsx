import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

import styles from '@/app/(frontend)/PageShell.module.css'

const HEADING_COLOR_CLASSES: Record<string, string> = {
  purple: styles.headingPurple,
  orange: styles.headingOrange,
  yellow: styles.headingYellow,
  green: styles.headingGreen,
}

/** Renders a project's `content` field to match the site's existing case-study
 * typography (PageShell.module.css) instead of the library's default markup.
 * Headings: an "h3" node becomes the small uncolored sub-heading; anything
 * else becomes the larger heading, picking up a colored dot if any of its
 * text was given a "Text Color" state in the admin (used to mark which
 * section of a model/framework it belongs to, e.g. the Financieel gedrag
 * model's four categories). */
export const projectContentConverters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })

    if (node.tag === 'h3') {
      return <h3 className={styles.subheading}>{children}</h3>
    }

    const colorKey = node.children
      .map((child) => (child as unknown as { headingColor?: string }).headingColor)
      .find((color): color is string => typeof color === 'string')
    const colorClass = colorKey ? (HEADING_COLOR_CLASSES[colorKey] ?? '') : ''

    return <h2 className={`${styles.heading} ${colorClass}`}>{children}</h2>
  },
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return <p className={styles.paragraph}>{children}</p>
  },
  list: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const Tag = node.tag as 'ul' | 'ol'
    return <Tag className={styles.listBlock}>{children}</Tag>
  },
  listitem: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return <li>{children}</li>
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const newTab = node.fields.newTab
    return (
      <a
        href={node.fields.url ?? '#'}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className={styles.inlineLink}
      >
        {children}
      </a>
    )
  },
})
