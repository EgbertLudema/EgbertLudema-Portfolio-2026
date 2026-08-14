'use client'

import gsap from 'gsap'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'

import styles from './PageTransition.module.css'

// Smooth, monotonic power eases rather than elastic/back: those overshoot
// and oscillate, which for a blob growing to cover the whole screen mostly
// happens off-screen (invisible) — the animation *looks* done almost
// immediately regardless of duration, which read as an abrupt jump cut
// followed by a stalled hold rather than something smooth. A plain
// ease reaches its target only at the very end, so the growth/shrink is
// visible for the whole duration — slower, but that's what makes it read
// as smooth and relaxed instead of instant.
const COVER_DURATION = 1.1
const REVEAL_DURATION = 0.95

type Origin = { x: number; y: number }

type PageTransitionContextValue = {
  navigate: (href: string, origin?: Origin) => void
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null)

/** Read by `TransitionLink` to trigger the bubble transition instead of an
 * instant route swap. Throws if used outside `PageTransitionProvider`
 * (mounted once, in the root layout) so a missing provider fails loudly
 * rather than silently falling back to a plain navigation. */
export function usePageTransition() {
  const ctx = useContext(PageTransitionContext)
  if (!ctx) throw new Error('usePageTransition must be used within PageTransitionProvider')
  return ctx
}

/** A perfectly round dark blob that eases out from wherever was clicked,
 * growing unhurried to fully cover the screen (masking the moment the old
 * route unmounts and the new one — Server Component payload, and for the
 * homepage a fresh WebGL canvas — mounts), then eases back down to nothing
 * at the same point to reveal it. Being a circle rather than a panel, it
 * has no edges to square off in the first place. The small accent dot at
 * screen centre doubles as a "something is loading" reassurance during
 * whatever gap there is between the two phases.
 *
 * Only navigations that go through `TransitionLink` (in-app `<Link>`
 * clicks) get the bubble; browser back/forward and any plain `<a>` still
 * navigate instantly, since there's no reliable way to intercept and delay
 * those the same way. */
export default function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevPathnameRef = useRef(pathname)
  const isAnimatingRef = useRef(false)
  const originRef = useRef<Origin>({ x: 0, y: 0 })

  const navigate = (href: string, origin?: Origin) => {
    if (isAnimatingRef.current || href === pathname) return
    isAnimatingRef.current = true

    const overlay = overlayRef.current
    if (!overlay) {
      router.push(href)
      return
    }

    const point = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    originRef.current = point
    // Big enough to fully cover the viewport from a click in any corner
    // (worst case the circle has to reach the opposite corner, i.e. the
    // full viewport diagonal) plus headroom for the elastic overshoot.
    const diameter = Math.hypot(window.innerWidth, window.innerHeight) * 2.4

    gsap.set(overlay, {
      width: diameter,
      height: diameter,
      left: point.x,
      top: point.y,
      xPercent: -50,
      yPercent: -50,
      scale: 0,
    })

    const tl = gsap.timeline({ onComplete: () => router.push(href) })
    tl.to(overlay, { scale: 1, duration: COVER_DURATION, ease: 'power2.inOut' }, 0)
    if (dotRef.current) {
      tl.fromTo(
        dotRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' },
        COVER_DURATION * 0.55,
      )
    }
  }

  useEffect(() => {
    if (prevPathnameRef.current === pathname) return
    prevPathnameRef.current = pathname

    const overlay = overlayRef.current
    if (!overlay || !isAnimatingRef.current) {
      // A navigation that didn't go through `navigate` (back/forward,
      // a stray plain link): nothing to reveal, just reset state.
      isAnimatingRef.current = false
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false
        gsap.set(overlay, { scale: 0 })
      },
    })
    if (dotRef.current) {
      tl.to(dotRef.current, { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0)
    }
    // Shrinks back down to nothing at the same point it grew from, like a
    // bubble settling back into where it came from.
    tl.to(overlay, { scale: 0, duration: REVEAL_DURATION, ease: 'power2.inOut' }, 0.05)

    if (contentRef.current) {
      // `children` contains `position: fixed` elements (every page's
      // `.stage`) meant to sit relative to the real viewport. A lingering
      // inline `transform` on this wrapper — which GSAP leaves behind even
      // once `y` has animated back to 0 — would turn it into the
      // containing block for those instead (per the CSS transform spec),
      // silently breaking their positioning and hit-testing. Clear it
      // once the entrance settles rather than leaving it in place.
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'transform',
        },
        0.3,
      )
    }
  }, [pathname])

  return (
    <PageTransitionContext.Provider value={{ navigate }}>
      <div ref={contentRef}>{children}</div>
      <div ref={overlayRef} className={styles.overlay} />
      <span ref={dotRef} className={styles.dot} />
    </PageTransitionContext.Provider>
  )
}
