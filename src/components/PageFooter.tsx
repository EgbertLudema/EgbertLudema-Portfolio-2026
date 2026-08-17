import { getPayload } from 'payload'

import config from '@payload-config'
import type { Locale } from '@/lib/locale'
import styles from '@/app/(frontend)/PageShell.module.css'

async function getContactPage(locale: Locale) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'contact-page', locale })
}

/** Mail/socials + copyright, shared by every non-homepage route. The
 * homepage renders its own equivalent inline in Experience.tsx, since
 * there it's pinned to the viewport bottom (position: absolute) over the
 * 3D canvas rather than sitting in normal document flow like it does
 * here — same content, different layout context (mirrors PageNav). */
export default async function PageFooter({ locale }: { locale: Locale }) {
  const contact = await getContactPage(locale)
  const socials = (contact.socials ?? []).filter(
    (social): social is { label: string; url: string; id?: string | null } =>
      Boolean(social?.label && social?.url),
  )
  const year = new Date().getFullYear()

  return (
    <footer className={styles.pageFooter}>
      <div className={styles.pageFooterLinks}>
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className={styles.pageFooterLink}>
            Mail
          </a>
        ) : null}
        {socials.map((social, index) => (
          <a
            key={social.id ?? index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pageFooterLink}
          >
            {social.label}
          </a>
        ))}
      </div>
      <span className={styles.pageFooterCopyright}>&copy; {year} Egbert Ludema</span>
    </footer>
  )
}
