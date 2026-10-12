'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import Clock from '@/components/experience/Clock'
import LanguageSwitch from '@/components/LanguageSwitch'
import NavItemLink, { type NavLink } from '@/components/NavItemLink'
import TransitionLink from '@/components/TransitionLink'
import { getDictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import styles from '@/app/(frontend)/PageShell.module.css'

/** Nested routes stay "on" their parent's nav item, e.g. /projects/[slug]
 * keeps Projects highlighted. Home only matches itself, or it would match
 * everything. */
function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Below this many pixels of scroll, the nav is still "at the top" of the
// page and shows its full, relaxed size; past it, it compacts down.
const SCROLL_COLLAPSE_THRESHOLD = 24

/** Full-width site nav (mark, clock, section links, language switch),
 * shared by every non-homepage route. The homepage renders its own
 * equivalent inline in Experience.tsx, since there it floats over the 3D
 * canvas (position: absolute) rather than sitting in normal document flow
 * like it does here: same look, different layout context. `navLinks`
 * come from the Navigation global, fetched by the PageNav server wrapper. */
export default function PageNavClient({
  locale,
  navLinks,
}: {
  locale: Locale
  navLinks: NavLink[]
}) {
  const t = getDictionary(locale)
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // The page itself never scrolls (PageShell's .stage is the fixed,
    // overflow-y: auto element), so the nav's own direct parent is that
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

  const links: NavLink[] = [{ id: 'home', href: '/', label: t.nav.home, external: false }, ...navLinks]

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
          const active = !link.external && isNavActive(pathname, link.href)
          return (
            <NavItemLink
              key={link.id}
              link={link}
              className={`${styles.pageNavLink} ${active ? styles.pageNavLinkActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? <span className={styles.pageNavDot} /> : null}
              {link.label}
            </NavItemLink>
          )
        })}
        <LanguageSwitch locale={locale} />
      </nav>
    </header>
  )
}
