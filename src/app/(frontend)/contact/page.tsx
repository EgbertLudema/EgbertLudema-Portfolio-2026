import Link from 'next/link'
import type { Metadata } from 'next'

import styles from '../PageShell.module.css'

export const metadata: Metadata = {
  title: 'Contact · Egbert Ludema',
  description: 'Get in touch.',
}

export default function ContactPage() {
  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <Link href="/" className={styles.back}>
          &larr; Back to portfolio
        </Link>
        <header className={styles.header}>
          <p className={styles.category}>CONTACT · 2026</p>
          <h1 className={styles.title}>Contact</h1>
          <p className={styles.description}>
            Reach out about a project, a collaboration, or anything else.
          </p>
          <a className={styles.contactLink} href="mailto:egbertludema2001@gmail.com">
            egbertludema2001@gmail.com
          </a>
        </header>
      </article>
    </main>
  )
}
