import Link from 'next/link'

import styles from './PageShell.module.css'

export default function NotFound() {
  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <Link href="/" className={styles.back}>
          &larr; Back to portfolio
        </Link>
        <header className={styles.header}>
          <h1 className={styles.title}>Not found</h1>
          <p className={styles.description}>
            There&apos;s nothing here. The page or project you&apos;re looking for doesn&apos;t
            exist.
          </p>
        </header>
      </article>
    </main>
  )
}
