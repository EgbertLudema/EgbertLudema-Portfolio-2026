'use client'

import { useEffect, useState } from 'react'

import type { Locale } from '@/lib/locale'
import styles from './Experience.module.css'

const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  nl: 'nl-NL',
}

export default function Clock({ locale }: { locale: Locale }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!now) return <div className={styles.clock} />

  const date = now.toLocaleDateString(INTL_LOCALE[locale], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  // Always 24h regardless of language (en-GB rather than en-US, which
  // would switch to a 12h AM/PM clock).
  const time = now.toLocaleTimeString(locale === 'nl' ? 'nl-NL' : 'en-GB')

  return (
    <div className={styles.clock}>
      <span>{date}</span>
      <span className={styles.clockTime}>{time}</span>
    </div>
  )
}
