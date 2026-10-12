import type { Page } from '@/payload-types'
import TransitionLink from '@/components/TransitionLink'
import { getContactDetails } from '@/lib/contactDetails'
import type { Locale } from '@/lib/locale'
import styles from '@/app/(frontend)/PageShell.module.css'

type HeroLink = { id: string; label: string; href: string; kind: 'external' | 'internal' | 'file' }

export default async function PageHero({
  title,
  hero,
  locale,
}: {
  title: string
  hero: Page['hero']
  locale: Locale
}) {
  const photo = typeof hero?.photo === 'object' ? hero.photo : null
  const contact = hero?.showContactDetails ? await getContactDetails(locale) : null

  const links: HeroLink[] = (hero?.links ?? []).flatMap((link, index): HeroLink[] => {
    const id = link.id ?? String(index)
    if (link.type === 'file') {
      const file = typeof link.file === 'object' ? link.file : null
      return file?.url ? [{ id, label: link.label, href: file.url, kind: 'file' }] : []
    }
    if (!link.url) return []
    return [{ id, label: link.label, href: link.url, kind: link.url.startsWith('/') ? 'internal' : 'external' }]
  })
  for (const social of contact?.socials ?? []) {
    links.push({ id: social.id, label: social.label, href: social.url, kind: 'external' })
  }

  return (
    <header className={`${styles.header} ${photo?.url ? styles.headerWithPhoto : ''}`}>
      {photo?.url ? <img className={styles.photo} src={photo.url} alt={photo.alt ?? ''} /> : null}
      <div className={styles.headerText}>
        {hero?.category ? <p className={styles.category}>{hero.category}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {hero?.description ? <p className={styles.description}>{hero.description}</p> : null}
        {contact?.email ? (
          <a className={styles.contactLink} href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        ) : null}
        {links.length > 0 ? (
          <div className={styles.linkRow}>
            {links.map((link) =>
              link.kind === 'internal' ? (
                <TransitionLink key={link.id} href={link.href} className={styles.linkPill}>
                  {link.label} &rarr;
                </TransitionLink>
              ) : (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkPill}
                >
                  {link.label} {link.kind === 'file' ? '↓' : '↗'}
                </a>
              ),
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}
