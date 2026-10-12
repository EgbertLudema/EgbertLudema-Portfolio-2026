import type { MediaBlock as MediaBlockProps } from '@/payload-types'
import styles from '@/app/(frontend)/PageShell.module.css'

export default function MediaBlock({ media, caption }: MediaBlockProps) {
  const image = typeof media === 'object' ? media : null
  if (!image?.url) return null

  return (
    <figure className={styles.mediaBlock}>
      <img className={styles.heroImage} src={image.url} alt={image.alt ?? caption ?? ''} />
      {caption ? <figcaption className={styles.mediaCaption}>{caption}</figcaption> : null}
    </figure>
  )
}
