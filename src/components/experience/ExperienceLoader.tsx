'use client'

import dynamic from 'next/dynamic'

import type { ExperienceItem } from './items'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

export default function ExperienceLoader({ items }: { items: ExperienceItem[] }) {
  return <Experience items={items} />
}
