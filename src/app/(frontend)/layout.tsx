import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Geist_Mono } from 'next/font/google'
import React from 'react'

import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import PageTransitionProvider from '@/components/PageTransition'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getDictionary(locale)
  return {
    title: t.meta.title,
    description: t.meta.description,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${mono.variable} ${title.variable}`}>
      <body>
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </body>
    </html>
  )
}
