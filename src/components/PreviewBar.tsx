import styles from '@/app/(frontend)/PageShell.module.css'
import LivePreviewListener from './LivePreviewListener'

/** Shown while draft mode is on (after hitting "Preview" in the admin), so
 * it's obvious the page shows unpublished content, with a way back out. */
export default function PreviewBar({ path }: { path: string }) {
  return (
    <>
      <LivePreviewListener />
      <div className={styles.previewBar} role="status">
        <span className={styles.previewBarDot} />
        Draft preview
        <a
          className={styles.previewBarExit}
          href={`/next/exit-preview?${new URLSearchParams({ path }).toString()}`}
        >
          Exit
        </a>
      </div>
    </>
  )
}
