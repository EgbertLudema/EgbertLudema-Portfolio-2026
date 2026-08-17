import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Media } from '@/payload-types'
import { getLocale } from '@/lib/getLocale'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'
import styles from '../PageShell.module.css'

export const revalidate = 0

async function getContactPage(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'contact-page', locale, depth: 1 })
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const contact = await getContactPage(locale)
  return {
    title: `Egbert Ludema · ${contact.title}`,
    description: contact.description,
  }
}

export default async function ContactPage() {
  const locale = await getLocale()
  const contact = await getContactPage(locale)
  const socials = (contact.socials ?? []).filter(
    (social): social is { label: string; url: string; id?: string | null } => Boolean(social?.label && social?.url),
  )
  const photo = typeof contact.photo === 'object' ? (contact.photo as Media) : null

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <header className={`${styles.header} ${photo?.url ? styles.headerWithPhoto : ''}`}>
          {photo?.url ? (
            <img className={styles.photo} src={photo.url} alt={photo.alt ?? ''} />
          ) : null}
          <div className={styles.headerText}>
            {contact.category ? <p className={styles.category}>{contact.category}</p> : null}
            <h1 className={styles.title}>{contact.title}</h1>
            <p className={styles.description}>{contact.description}</p>
            <a className={styles.contactLink} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            {socials.length > 0 ? (
              <div className={styles.linkRow}>
                {socials.map((social, index) => (
                  <a
                    key={social.id ?? index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkPill}
                  >
                    {social.label} ↗
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <PageFooter locale={locale} />
      </article>
    </main>
  )
}
