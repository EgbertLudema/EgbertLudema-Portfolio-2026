import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import styles from '../PageShell.module.css'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Skills · Egbert Ludema',
  description: 'Skills used across my projects.',
}

export default async function SkillsPage() {
  const payload = await getPayload({ config })
  const { docs: skills } = await payload.find({ collection: 'skills', sort: 'title', limit: 100 })

  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <Link href="/" className={styles.back}>
          &larr; Back to portfolio
        </Link>
        <header className={styles.header}>
          <p className={styles.category}>SKILLS · 2026</p>
          <h1 className={styles.title}>Skills</h1>
          <p className={styles.description}>
            Every skill used across my projects. Hovering one will soon show which projects
            it&apos;s linked to.
          </p>
        </header>

        {skills.length > 0 ? (
          <ul className={styles.skillList}>
            {skills.map((skill) => (
              <li className={styles.skillChip} key={skill.id}>
                {skill.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.skillsEmpty}>No skills added yet.</p>
        )}
      </article>
    </main>
  )
}
