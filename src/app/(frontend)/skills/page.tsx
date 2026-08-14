import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Skill } from '@/payload-types'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import LanguageSwitch from '@/components/LanguageSwitch'
import TransitionLink from '@/components/TransitionLink'
import styles from '../PageShell.module.css'
import SkillsFilter from './SkillsFilter'

export const revalidate = 0

async function getSkillsPage(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'skills-page', locale })
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const skillsPage = await getSkillsPage(locale)
  return {
    title: `${skillsPage.title} · Egbert Ludema`,
    description: skillsPage.description,
  }
}

export default async function SkillsPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const payload = await getPayload({ config })
  const [skillsPage, { docs: skills }, { docs: projects }] = await Promise.all([
    getSkillsPage(locale),
    payload.find({ collection: 'skills', sort: 'title', limit: 100 }),
    payload.find({ collection: 'projects', sort: 'order', depth: 1, limit: 100, locale }),
  ])

  const projectItems = projects.map((project) => ({
    id: String(project.id),
    slug: project.slug,
    title: project.title,
    category: project.category ?? '',
    skillSlugs: (project.skills ?? [])
      .filter((skill): skill is Skill => typeof skill === 'object')
      .map((skill) => skill.slug)
      .filter((slug): slug is string => Boolean(slug)),
  }))

  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <div className={styles.topRow}>
          <TransitionLink href="/" className={styles.back}>
            &larr; {t.common.backToPortfolio}
          </TransitionLink>
          <LanguageSwitch locale={locale} />
        </div>
        <header className={styles.header}>
          {skillsPage.category ? <p className={styles.category}>{skillsPage.category}</p> : null}
          <h1 className={styles.title}>{skillsPage.title}</h1>
          <p className={styles.description}>{skillsPage.description}</p>
        </header>

        <Suspense fallback={null}>
          <SkillsFilter
            skills={skills.map((skill) => ({ id: String(skill.id), slug: skill.slug, title: skill.title }))}
            projects={projectItems}
            noSkillsAdded={t.common.noSkillsAdded}
            projectsLabel={t.common.projects}
            noProjectsForSkill={t.common.noProjectsForSkill}
          />
        </Suspense>
      </article>
    </main>
  )
}
