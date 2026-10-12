import { RichText } from '@payloadcms/richtext-lexical/react'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import { projectContentConverters } from '@/lib/projectRichTextConverters'
import styles from '@/app/(frontend)/PageShell.module.css'

export default function ContentBlock({ richText }: ContentBlockProps) {
  if (!richText) return null

  return (
    <div className={styles.body}>
      <RichText data={richText} converters={projectContentConverters} disableContainer />
    </div>
  )
}
