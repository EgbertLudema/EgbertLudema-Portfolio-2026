import { cache } from 'react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import RenderBlocks from '@/blocks/RenderBlocks'
import PageHero from '@/heros/PageHero'
import { getLocale } from '@/lib/getLocale'
import type { Locale } from '@/lib/locale'
import { pagePath } from '@/lib/previewPath'
import { isPublished } from '@/lib/published'
import PageFooter from './PageFooter'
import PageNav from './PageNav'
import PreviewBar from './PreviewBar'
import styles from '@/app/(frontend)/PageShell.module.css'

/** In draft mode (admin preview) this also returns pages with status
 * Draft, otherwise only published ones. Cached so generateMetadata and the page share
 * one query. */
const getPage = cache(async (slug: string, locale: Locale, draft: boolean) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: draft ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, isPublished] },
    depth: 2,
    limit: 1,
    locale,
  })
  return docs[0] ?? null
})

export async function generateCmsPageMetadata(slug: string): Promise<Metadata> {
  const locale = await getLocale()
  const { isEnabled: draft } = await draftMode()
  const page = await getPage(slug, locale, draft)
  if (!page) return { title: 'Egbert Ludema · Not found' }
  return {
    title: `Egbert Ludema · ${page.meta?.title || page.title}`,
    description: page.meta?.description || page.hero?.description || undefined,
  }
}

/** A page from the Pages collection: hero, then its layout blocks. */
export default async function CmsPage({ slug }: { slug: string }) {
  const locale = await getLocale()
  const { isEnabled: draft } = await draftMode()
  const page = await getPage(slug, locale, draft)
  if (!page) notFound()

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <PageHero title={page.title} hero={page.hero} locale={locale} />
        <RenderBlocks blocks={page.layout ?? []} locale={locale} />
        <PageFooter locale={locale} />
      </article>
      {draft ? <PreviewBar path={pagePath(slug)} /> : null}
    </main>
  )
}
