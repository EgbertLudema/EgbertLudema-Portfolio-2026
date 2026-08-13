import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Fragment } from 'react'

import config from '@payload-config'
import type { Media, Skill } from '@/payload-types'
import styles from '../../PageShell.module.css'

export const revalidate = 0

async function getProject(slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Project not found · Egbert Ludema' }
  return {
    title: `${project.title} · Egbert Ludema`,
    description: project.description,
  }
}

/** Splits the plain-text `content` field into paragraph/list blocks on blank
 * lines. A block renders as a bullet list if every one of its lines starts
 * with "- ", otherwise as a single paragraph with line breaks preserved. */
function renderContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const isList = lines.length > 0 && lines.every((line) => line.startsWith('- '))

    if (isList) {
      return (
        <ul className={styles.listBlock} key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{line.replace(/^- /, '')}</li>
          ))}
        </ul>
      )
    }

    return (
      <p className={styles.paragraph} key={blockIndex}>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    )
  })
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  const heroImage = typeof project.heroImage === 'object' ? (project.heroImage as Media) : null
  const gallery = (project.gallery ?? []).filter(
    (item): item is { image: Media; caption?: string | null; id?: string | null } =>
      typeof item.image === 'object',
  )
  const skills = (project.skills ?? []).filter((skill): skill is Skill => typeof skill === 'object')

  return (
    <main className={styles.stage}>
      <article className={styles.article}>
        <Link href="/" className={styles.back}>
          &larr; Back to portfolio
        </Link>

        <header className={styles.header}>
          {project.category ? <p className={styles.category}>{project.category}</p> : null}
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.description}>{project.description}</p>
        </header>

        {heroImage?.url ? (
          <img className={styles.heroImage} src={heroImage.url} alt={heroImage.alt ?? ''} />
        ) : null}

        {project.content ? (
          <div className={styles.body}>{renderContent(project.content)}</div>
        ) : null}

        {gallery.length > 0 ? (
          <section>
            <p className={styles.sectionLabel}>Gallery</p>
            <div className={styles.gallery}>
              {gallery.map((item, index) => (
                <figure className={styles.galleryFigure} key={item.id ?? index}>
                  <img
                    className={styles.galleryImage}
                    src={item.image.url ?? ''}
                    alt={item.image.alt ?? item.caption ?? ''}
                  />
                  {item.caption ? (
                    <figcaption className={styles.galleryCaption}>{item.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.skills}>
          <p className={styles.sectionLabel}>Skills</p>
          {skills.length > 0 ? (
            <ul className={styles.skillList}>
              {skills.map((skill) => (
                <li className={styles.skillChip} key={skill.id}>
                  {skill.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.skillsEmpty}>No skills linked yet.</p>
          )}
        </section>
      </article>
    </main>
  )
}
