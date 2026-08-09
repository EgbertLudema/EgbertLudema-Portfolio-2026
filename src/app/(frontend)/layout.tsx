import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import React from 'react'

import './globals.css'

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portfolio — Egbert Ludema',
  description: 'Selected work, viewed in three dimensions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  )
}
