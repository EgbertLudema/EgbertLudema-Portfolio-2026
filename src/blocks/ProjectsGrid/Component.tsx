import { Suspense } from 'react'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { ProjectsGridBlock as ProjectsGridBlockProps, Skill } from '@/payload-types'
import { getDictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import { isPublished } from '@/lib/published'
import ProjectsFilter from './ProjectsFilter'

/** Every published project as a card grid, optionally filterable by the
 * skills linked to them (what the old /projects page was). */
export default async function ProjectsGridBlock({
  label,
  showFilter,
  locale,
}: ProjectsGridBlockProps & { locale: Locale }) {
  const t = getDictionary(locale)
  const payload = await getPayload({ config })
  const [{ docs: skills }, { docs: projects }] = await Promise.all([
    payload.find({ collection: 'skills', sort: 'title', limit: 100 }),
    payload.find({
      collection: 'projects',
      where: isPublished,
      sort: 'order',
      depth: 1,
      limit: 100,
      locale,
    }),
  ])

  const projectItems = projects.map((project) => {
    const heroImage = typeof project.heroImage === 'object' ? project.heroImage : null
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
    <Suspense fallback={null}>
      <ProjectsFilter
        skills={filterableSkills.map((skill) => ({ id: String(skill.id), slug: skill.slug, title: skill.title }))}
        projects={projectItems}
        showFilter={showFilter !== false}
        noSkillsAdded={t.common.noSkillsAdded}
        projectsLabel={label}
        noProjectsForSkill={t.common.noProjectsForSkill}
      />
    </Suspense>
  )
}
