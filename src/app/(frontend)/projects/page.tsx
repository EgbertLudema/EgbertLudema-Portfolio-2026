import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Media, Skill } from '@/payload-types'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'
import styles from '../PageShell.module.css'
import ProjectsFilter from './ProjectsFilter'

export const revalidate = 0

/** This page's header copy still lives on the `skills-page` global (kept
 * under its original slug to avoid a Postgres schema migration) even
 * though the route itself moved from /skills to /projects: this page
 * absorbed the old skills page, since that page was really just the
 * project list with a skill filter. */
async function getProjectsPageCopy(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'skills-page', locale })
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const projectsPage = await getProjectsPageCopy(locale)
  return {
    title: `Egbert Ludema · ${projectsPage.title}`,
    description: projectsPage.description,
  }
}

export default async function ProjectsPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const payload = await getPayload({ config })
  const [projectsPage, { docs: skills }, { docs: projects }] = await Promise.all([
    getProjectsPageCopy(locale),
    payload.find({ collection: 'skills', sort: 'title', limit: 100 }),
    payload.find({ collection: 'projects', sort: 'order', depth: 1, limit: 100, locale }),
  ])

  const projectItems = projects.map((project) => {
    const heroImage = typeof project.heroImage === 'object' ? (project.heroImage as Media) : null
    return {
      id: String(project.id),
      slug: project.slug,
      title: project.title,
      category: project.category ?? '',
      heroImage: heroImage?.url ? { url: heroImage.url, alt: heroImage.alt ?? '' } : null,
      accentColorA: project.accentColorA || '#f4f1ec',
      accentColorB: project.accentColorB || '#d8cfe8',
      skillSlugs: (project.skills ?? [])
        .filter((skill): skill is Skill => typeof skill === 'object')
        .map((skill) => skill.slug)
        .filter((slug): slug is string => Boolean(slug)),
    }
  })

  const linkedSkillSlugs = new Set(projectItems.flatMap((project) => project.skillSlugs))
  const filterableSkills = skills.filter((skill) => linkedSkillSlugs.has(skill.slug))

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <header className={styles.header}>
          {projectsPage.category ? <p className={styles.category}>{projectsPage.category}</p> : null}
          <h1 className={styles.title}>{projectsPage.title}</h1>
          <p className={styles.description}>{projectsPage.description}</p>
        </header>

        <Suspense fallback={null}>
          <ProjectsFilter
            skills={filterableSkills.map((skill) => ({ id: String(skill.id), slug: skill.slug, title: skill.title }))}
            projects={projectItems}
            noSkillsAdded={t.common.noSkillsAdded}
            projectsLabel={t.common.projects}
            noProjectsForSkill={t.common.noProjectsForSkill}
          />
        </Suspense>

        <PageFooter locale={locale} />
      </article>
    </main>
  )
}
