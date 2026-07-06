import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Full-stack developer and designer building fast, functional digital products.',
  title: 'Egbert Ludema - Full-stack Developer',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
