import React from 'react'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './styles.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata = {
  description: 'Full-stack developer and designer building fast, functional digital products.',
  title: 'Egbert Ludema — Full-stack Developer & Designer',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="nl" className={`${fraunces.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
