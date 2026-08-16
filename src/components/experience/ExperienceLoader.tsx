'use client'

import dynamic from 'next/dynamic'

import type { Locale } from '@/lib/locale'
import type { ExperienceItem } from './items'
import type { ContactInfo } from './Experience'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

export default function ExperienceLoader({
  items,
  locale,
  contact,
}: {
  items: ExperienceItem[]
  locale: Locale
  contact: ContactInfo
}) {
  return <Experience items={items} locale={locale} contact={contact} />
}
