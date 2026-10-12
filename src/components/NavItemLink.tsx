'use client'

import type { ReactNode } from 'react'

import TransitionLink from './TransitionLink'

export type NavLink = {
  id: string
  href: string
  label: string
  external: boolean
}

/** One CMS-driven nav link: internal ones play the page transition,
 * external ones (custom https:// URLs) open in a new tab. */
export default function NavItemLink({
  link,
  className,
  children,
  ...props
}: {
  link: NavLink
  className?: string
  children?: ReactNode
  'aria-current'?: 'page'
}) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
        {children ?? link.label}
      </a>
    )
  }

  return (
    <TransitionLink href={link.href} className={className} {...props}>
      {children ?? link.label}
    </TransitionLink>
  )
}
