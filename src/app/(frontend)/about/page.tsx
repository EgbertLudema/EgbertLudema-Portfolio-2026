import Link from 'next/link'
import type { Metadata } from 'next'

import styles from '../PageShell.module.css'

export const metadata: Metadata = {
  title: 'About me · Egbert Ludema',
  description: 'A bit about who I am and what I do.',
}

export default function AboutPage() {
  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <Link href="/" className={styles.back}>
          &larr; Back to portfolio
        </Link>
        <header className={styles.header}>
          <p className={styles.category}>ABOUT · 2026</p>
          <h1 className={styles.title}>About me</h1>
          <p className={styles.description}>
            Placeholder bio, replace with a real introduction: who you are, what you build, and what
            you&apos;re looking for next.
          </p>
        </header>
      </article>
    </main>
  )
}
