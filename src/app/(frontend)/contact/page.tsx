import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import LanguageSwitch from '@/components/LanguageSwitch'
import TransitionLink from '@/components/TransitionLink'
import styles from '../PageShell.module.css'

export const revalidate = 0

async function getContactPage(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'contact-page', locale })
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const contact = await getContactPage(locale)
  return {
    title: `${contact.title} · Egbert Ludema`,
    description: contact.description,
  }
}

export default async function ContactPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const contact = await getContactPage(locale)

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
          {contact.category ? <p className={styles.category}>{contact.category}</p> : null}
          <h1 className={styles.title}>{contact.title}</h1>
          <p className={styles.description}>{contact.description}</p>
          <a className={styles.contactLink} href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </header>
      </article>
    </main>
  )
}
