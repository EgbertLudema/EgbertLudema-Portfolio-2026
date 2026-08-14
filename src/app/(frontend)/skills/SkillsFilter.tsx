'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import TransitionLink from '@/components/TransitionLink'
import styles from '../PageShell.module.css'

export type SkillItem = {
  id: string
  slug: string
  title: string
}

export type FilterableProject = {
  id: string
  slug: string
  title: string
  category: string
  skillSlugs: string[]
}

/** Skill chips double as a single-select filter (querystring-backed, so
 * arriving from a project's skill link pre-selects it) for the project
 * list below. Filtering is a same-page state change, so it goes through
 * plain client-side navigation rather than `TransitionLink`'s bubble — the
 * bubble is reserved for actually leaving the page. */
export default function SkillsFilter({
  skills,
  projects,
  noSkillsAdded,
  projectsLabel,
  noProjectsForSkill,
}: {
  skills: SkillItem[]
  projects: FilterableProject[]
  noSkillsAdded: string
  projectsLabel: string
  noProjectsForSkill: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('skill')

  const setActive = (slug: string) => {
    const next = active === slug ? null : slug
    const params = new URLSearchParams(searchParams.toString())
    if (next) {
      params.set('skill', next)
    } else {
      params.delete('skill')
    }
    const query = params.toString()
    router.replace(query ? `/skills?${query}` : '/skills', { scroll: false })
  }

  const filteredProjects = active ? projects.filter((project) => project.skillSlugs.includes(active)) : projects

  return (
    <>
      {skills.length > 0 ? (
        <ul className={styles.skillList}>
          {skills.map((skill) => (
            <li key={skill.id}>
              <button
                type="button"
                onClick={() => setActive(skill.slug)}
                aria-pressed={active === skill.slug}
                className={`${styles.skillChip} ${active === skill.slug ? styles.skillChipActive : ''}`}
              >
                {skill.title}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.skillsEmpty}>{noSkillsAdded}</p>
      )}

      <section className={styles.projectsSection}>
        <p className={styles.sectionLabel}>{projectsLabel}</p>
        {filteredProjects.length > 0 ? (
          <div className={styles.relatedList}>
            {filteredProjects.map((project) => (
              <TransitionLink
                key={project.id}
                href={`/projects/${project.slug}`}
                className={styles.relatedCard}
              >
                {project.category ? (
                  <span className={styles.relatedCategory}>{project.category}</span>
                ) : null}
                <span className={styles.relatedTitle}>{project.title} &rarr;</span>
              </TransitionLink>
            ))}
          </div>
        ) : (
          <p className={styles.skillsEmpty}>{noProjectsForSkill}</p>
        )}
      </section>
    </>
  )
}
