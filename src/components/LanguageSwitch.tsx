'use client'

import { useRouter } from 'next/navigation'

import { LOCALE_COOKIE, type Locale } from '@/lib/locale'
import styles from './LanguageSwitch.module.css'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  nl: 'NL',
}

/** Sets the plain (non-httpOnly) locale cookie the whole site reads
 * server-side, then refreshes so every Server Component re-fetches its
 * Payload content in the new language. No locale ever appears in the URL. */
export default function LanguageSwitch({ locale, className }: { locale: Locale; className?: string }) {
  const router = useRouter()

  const setLocale = (next: Locale) => {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <div className={`${styles.switch} ${className ?? ''}`} role="group" aria-label="Language">
      {(['en', 'nl'] as const).map((code, index) => (
        <span key={code} style={{ display: 'contents' }}>
          {index > 0 ? <span className={styles.divider}>/</span> : null}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={`${styles.link} ${locale === code ? styles.linkActive : ''}`}
          >
            {LOCALE_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  )
}
