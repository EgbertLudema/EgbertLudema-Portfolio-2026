'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { Locale } from '@/lib/locale'
import type { ExperienceItem } from './items'
import type { ContactInfo } from './Experience'
import HomeLoadingScreen from './HomeLoadingScreen'

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
  // Covers both gaps a blank page would otherwise leave: the dynamic
  // import's own download (before `Experience` mounts at all) and, once it
  // has, the moment before the Canvas has actually created a WebGL context
  // and rendered a first frame (see Scene's onReady).
  const [ready, setReady] = useState(false)

  return (
    <>
      <HomeLoadingScreen ready={ready} />
      <Experience
        items={items}
        locale={locale}
        contact={contact}
        onReady={() => setReady(true)}
      />
    </>
  )
}
