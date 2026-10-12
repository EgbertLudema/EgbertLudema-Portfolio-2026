import { getContactDetails } from '@/lib/contactDetails'
import type { Locale } from '@/lib/locale'
import styles from '@/app/(frontend)/PageShell.module.css'

/** Mail/socials + copyright, shared by every non-homepage route. The
 * homepage renders its own equivalent inline in Experience.tsx, since
 * there it's pinned to the viewport bottom (position: absolute) over the
 * 3D canvas rather than sitting in normal document flow like it does
 * here: same content, different layout context (mirrors PageNav). */
export default async function PageFooter({ locale }: { locale: Locale }) {
  const { email, socials } = await getContactDetails(locale)
  const year = new Date().getFullYear()

  return (
    <footer className={styles.pageFooter}>
      <div className={styles.pageFooterLinks}>
        {email ? (
          <a href={`mailto:${email}`} className={styles.pageFooterLink}>
            Mail
          </a>
        ) : null}
        {socials.map((social) => (
          <a
            key={social.id}
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
