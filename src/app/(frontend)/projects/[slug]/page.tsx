import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import config from '@payload-config'
import type { Media, Project, Skill } from '@/payload-types'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import type { Locale } from '@/lib/locale'
import { projectContentConverters } from '@/lib/projectRichTextConverters'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'
import TransitionLink from '@/components/TransitionLink'
import styles from '../../PageShell.module.css'
import Gallery from './Gallery'

export const revalidate = 0

async function getProject(slug: string, locale: Locale) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    locale,
  })
  return docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const project = await getProject(slug, locale)
  if (!project) return { title: 'Egbert Ludema · Project not found' }
  return {
    title: `Egbert Ludema · ${project.title}`,
    description: project.description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const t = getDictionary(locale)
  const project = await getProject(slug, locale)
  if (!project) notFound()

  const heroImage = typeof project.heroImage === 'object' ? (project.heroImage as Media) : null
  const links = (project.links ?? []).filter(
    (link): link is { label: string; url: string; id?: string | null } =>
      Boolean(link?.label && link?.url),
  )
  const gallery = (project.gallery ?? []).filter(
    (item): item is { image: Media; caption?: string | null; id?: string | null } =>
      typeof item.image === 'object',
  )
  const skills = (project.skills ?? []).filter((skill): skill is Skill => typeof skill === 'object')
  const relatedProjects = (project.relatedProjects ?? []).filter(
    (related): related is Project => typeof related === 'object',
  )

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <header className={styles.header}>
          {project.category ? <p className={styles.category}>{project.category}</p> : null}
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.description}>{project.description}</p>
          {links.length > 0 ? (
            <div className={styles.linkRow}>
              {links.map((link, index) => (
                <a
                  key={link.id ?? index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkPill}
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          ) : null}
        </header>

        {heroImage?.url ? (
          <img className={styles.heroImage} src={heroImage.url} alt={heroImage.alt ?? ''} />
        ) : null}

        {project.content ? (
          <div className={styles.body}>
            <RichText data={project.content} converters={projectContentConverters} disableContainer />
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <section>
            <p className={styles.sectionLabel}>{t.common.gallery}</p>
            <Gallery
              items={gallery.map((item, index) => ({
                id: String(item.id ?? index),
                url: item.image.url ?? '',
                alt: item.image.alt ?? item.caption ?? '',
                caption: item.caption,
              }))}
              locale={locale}
            />
          </section>
        ) : null}

        {relatedProjects.length > 0 ? (
          <section>
            <p className={styles.sectionLabel}>{t.common.related}</p>
            <div className={styles.relatedList}>
              {relatedProjects.map((related) => (
                <TransitionLink
                  key={related.id}
                  href={`/projects/${related.slug}`}
                  className={styles.relatedCard}
                >
                  {related.category ? (
                    <span className={styles.relatedCategory}>{related.category}</span>
                  ) : null}
                  <span className={styles.relatedTitle}>{related.title} &rarr;</span>
                </TransitionLink>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.skills}>
          <p className={styles.sectionLabel}>{t.common.skills}</p>
          {skills.length > 0 ? (
            <ul className={styles.skillList}>
              {skills.map((skill) => (
                <li key={skill.id}>
                  <TransitionLink href={`/projects?skill=${skill.slug}`} className={styles.skillChip}>
                    {skill.title}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.skillsEmpty}>{t.common.noSkillsLinked}</p>
          )}
        </section>

        <PageFooter locale={locale} />
      </article>
    </main>
  )
}
