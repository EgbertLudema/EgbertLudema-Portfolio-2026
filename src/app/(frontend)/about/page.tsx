import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import { renderContent } from '@/lib/renderContent'
import LanguageSwitch from '@/components/LanguageSwitch'
import TransitionLink from '@/components/TransitionLink'
import styles from '../PageShell.module.css'

export const revalidate = 0

async function getAboutPage(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'about-page', locale })
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const about = await getAboutPage(locale)
  return {
    title: `${about.title} · Egbert Ludema`,
    description: about.description,
  }
}

export default async function AboutPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const about = await getAboutPage(locale)

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
          {about.category ? <p className={styles.category}>{about.category}</p> : null}
          <h1 className={styles.title}>{about.title}</h1>
          <p className={styles.description}>{about.description}</p>
        </header>

        {about.content ? <div className={styles.body}>{renderContent(about.content)}</div> : null}
      </article>
    </main>
  )
}
