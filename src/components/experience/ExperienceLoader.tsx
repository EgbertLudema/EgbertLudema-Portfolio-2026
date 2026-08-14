'use client'

import dynamic from 'next/dynamic'

import type { Locale } from '@/lib/locale'
import type { ExperienceItem } from './items'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

export default function ExperienceLoader({
  items,
  locale,
}: {
  items: ExperienceItem[]
  locale: Locale
}) {
  return <Experience items={items} locale={locale} />
}
