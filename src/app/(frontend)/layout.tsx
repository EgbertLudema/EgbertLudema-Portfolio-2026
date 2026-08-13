import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist_Mono } from 'next/font/google'
import React from 'react'

import './globals.css'

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// Replaces the old serif title face: a clean, distinctive display grotesk
// (not another safe/generic sans) with enough character to still read as
// intentional at large display sizes. No italic master exists for this
// font, so the title styles switched from italic to upright to avoid a
// synthesized (warped) fake-italic slant.
const title = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-title',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portfolio · Egbert Ludema',
  description: 'Selected work, viewed in three dimensions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${title.variable}`}>
      <body>{children}</body>
    </html>
  )
}
