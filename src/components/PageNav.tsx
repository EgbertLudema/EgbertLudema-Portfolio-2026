'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import Clock from '@/components/experience/Clock'
import LanguageSwitch from '@/components/LanguageSwitch'
import TransitionLink from '@/components/TransitionLink'
import { getDictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import styles from '@/app/(frontend)/PageShell.module.css'

/** /projects/[slug] is still "on" the Projects nav item; the other two
 * routes have no nested pages so an exact match is enough. */
function isNavActive(pathname: string, href: string) {
  if (href === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/')
  return pathname === href
}

// Below this many pixels of scroll, the nav is still "at the top" of the
// page and shows its full, relaxed size; past it, it compacts down.
const SCROLL_COLLAPSE_THRESHOLD = 24

/** Full-width site nav (mark, clock, section links, language switch),
 * shared by every non-homepage route. The homepage renders its own
 * equivalent inline in Experience.tsx, since there it floats over the 3D
 * canvas (position: absolute) rather than sitting in normal document flow
 * like it does here — same look, different layout context. */
export default function PageNav({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // The page itself never scrolls (PageShell's .stage is the fixed,
    // overflow-y: auto element) — the nav's own direct parent is that
    // scroll container, so read scroll position from there instead of from
    // `window`, which stays at 0 the whole time.
    const scrollContainer = headerRef.current?.parentElement
    if (!scrollContainer) return

    const handleScroll = () => {
      setScrolled(scrollContainer.scrollTop > SCROLL_COLLAPSE_THRESHOLD)
    }
    handleScroll()
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/about', label: t.nav.about },
    { href: '/projects', label: t.nav.projects },
    { href: '/contact', label: t.nav.contact },
  ]

  return (
    <header
      ref={headerRef}
      className={`${styles.pageNav} ${scrolled ? styles.pageNavScrolled : ''}`}
    >
      <div className={styles.pageNavLeft}>
        <TransitionLink href="/" className={styles.mark}>
          <span className={styles.markDot} />
          {t.nav.mark}
        </TransitionLink>
        <div className={`${styles.clockWrap} ${scrolled ? styles.clockWrapHidden : ''}`}>
          <Clock locale={locale} />
        </div>
      </div>
      <nav className={styles.pageNavLinks} aria-label={t.nav.siteNavigation}>
        {links.map((link) => {
          const active = isNavActive(pathname, link.href)
          return (
            <TransitionLink
              key={link.href}
              href={link.href}
              className={`${styles.pageNavLink} ${active ? styles.pageNavLinkActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? <span className={styles.pageNavDot} /> : null}
              {link.label}
            </TransitionLink>
          )
        })}
        <LanguageSwitch locale={locale} />
      </nav>
    </header>
  )
}
