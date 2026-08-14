'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'

import { usePageTransition } from './PageTransition'

type TransitionLinkProps = ComponentProps<typeof Link>

/** Drop-in replacement for `next/link` that plays the bubble page
 * transition (growing from the click point) instead of navigating
 * instantly. Falls through to a normal navigation for modifier-clicks,
 * middle-clicks, and `target="_blank"` links, same as a plain `<a>` would. */
export default function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const { navigate } = usePageTransition()

  return (
    <Link
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        const targetAttr = event.currentTarget.target
        if (targetAttr && targetAttr !== '_self') return

        event.preventDefault()
        const url = typeof href === 'string' ? href : (href.pathname ?? '/')
        navigate(url, { x: event.clientX, y: event.clientY })
      }}
      {...props}
    />
  )
}
