'use client'

import { useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'

import TransitionLink from '@/components/TransitionLink'
import styles from '../PageShell.module.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip)
}

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
  heroImage: { url: string; alt: string } | null
  accentColorA: string
  accentColorB: string
  skillSlugs: string[]
}

/** Skill chips double as a single-select filter (querystring-backed, so
 * arriving from a project's skill link pre-selects it) for the project
 * list below. The filter itself is plain client state — `router.replace`
 * was tried first but goes through Next's navigation/RSC pipeline on every
 * click, which is far too slow for what's just a client-side array filter.
 * The URL is kept in sync with the native History API instead, which is
 * free of that cost and doesn't trigger a re-render loop of its own. */
export default function ProjectsFilter({
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
  const searchParams = useSearchParams()
  const [active, setActiveState] = useState<string | null>(() => searchParams.get('skill'))
  const gridRef = useRef<HTMLDivElement>(null)
  const flipStateRef = useRef<Flip.FlipState | null>(null)

  const setActive = (slug: string) => {
    const next = active === slug ? null : slug
    // Captured before the state update below commits, so it reflects the
    // grid as it looks right now — the "First" half of Flip's First-Last.
    flipStateRef.current = gridRef.current ? Flip.getState(gridRef.current.children) : null
    // absolute:true (below) pulls every card out of normal flow for the
    // duration of the flip, so the grid would otherwise collapse to zero
    // height and the footer jumps up underneath the still-animating cards.
    // Pin the height for the flip, then release it once Flip.from finishes.
    if (gridRef.current) {
      gridRef.current.style.minHeight = `${gridRef.current.offsetHeight}px`
    }
    setActiveState(next)

    const params = new URLSearchParams(window.location.search)
    if (next) {
      params.set('skill', next)
    } else {
      params.delete('skill')
    }
    const query = params.toString()
    const url = query ? `/projects?${query}` : '/projects'
    window.history.replaceState(window.history.state, '', url)
  }

  const filteredProjects = active ? projects.filter((project) => project.skillSlugs.includes(active)) : projects

  // Runs after the filtered grid above has committed to the DOM (the
  // "Last" half) — synchronously, before paint, so there's no flash of the
  // unanimated end state. Cards that persist across the filter change
  // animate from their old position/size to their new one; cards leaving
  // or entering are handled by onLeave/onEnter since Flip has no prior
  // state to interpolate them from.
  useLayoutEffect(() => {
    const state = flipStateRef.current
    if (!state) return
    flipStateRef.current = null

    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.03,
      absolute: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out' },
        ),
      onLeave: (elements) =>
        gsap.to(elements, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' }),
      onComplete: () => {
        if (gridRef.current) gridRef.current.style.minHeight = ''
      },
    })
    // filteredProjects is a new array every render, but its length/identity
    // change only when the filter actually changes the visible set — that's
    // exactly the DOM mutation this effect needs to run after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects])

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
          <div className={styles.projectGrid} ref={gridRef}>
            {filteredProjects.map((project) => (
              <TransitionLink key={project.id} href={`/projects/${project.slug}`} className={styles.projectCard}>
                <div
                  className={styles.projectCardMedia}
                  style={{
                    background: `linear-gradient(135deg, ${project.accentColorA}, ${project.accentColorB})`,
                  }}
                >
                  {project.heroImage ? (
                    <img
                      src={project.heroImage.url}
                      alt={project.heroImage.alt}
                      className={styles.projectCardImage}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className={styles.projectCardBody}>
                  {project.category ? (
                    <span className={styles.relatedCategory}>{project.category}</span>
                  ) : null}
                  <span className={styles.projectCardTitle}>{project.title} &rarr;</span>
                </div>
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
