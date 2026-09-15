'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

import styles from './HomeLoadingScreen.module.css'

// Same shrink timing as PageTransition's reveal (see PageTransition.tsx),
// so the very first thing a visitor sees resolves with the same motion
// language as every later in-app navigation, instead of a third, different
// animation.
const REVEAL_DURATION = 0.95
const REVEAL_DELAY = 0.05

/** Full-screen cover shown while the homepage's 3D experience is still
 * mounting (its JS chunk downloading, then its WebGL canvas spinning up),
 * so a visitor sees an intentional loading state - the same round blob and
 * pulsing accent dot as the page-transition overlay - instead of a blank
 * page. Shrinks away, same easing as PageTransition's reveal, once `ready`
 * flips true. */
export default function HomeLoadingScreen({ ready }: { ready: boolean }) {
  const [mounted, setMounted] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)

  // Sized against the real viewport (not a flat 100vw/100vh square) so it
  // stays a true circle and fully covers the screen from dead centre,
  // matching PageTransition's own diagonal-based sizing.
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const diameter = Math.hypot(window.innerWidth, window.innerHeight) * 2.4
    gsap.set(overlay, {
      width: diameter,
      height: diameter,
      left: window.innerWidth / 2,
      top: window.innerHeight / 2,
      xPercent: -50,
      yPercent: -50,
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    const overlay = overlayRef.current
    if (!overlay) {
      setMounted(false)
      return
    }

    const dot = dotRef.current
    if (dot) {
      // Stops the CSS pulse keyframes from fighting GSAP's own opacity/scale
      // tween below for control of the same two properties.
      dot.style.animation = 'none'
    }

    const tl = gsap.timeline({ onComplete: () => setMounted(false) })
    if (dot) {
      tl.to(dot, { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0)
    }
    tl.to(overlay, { scale: 0, duration: REVEAL_DURATION, ease: 'power2.inOut' }, REVEAL_DELAY)
  }, [ready])

  if (!mounted) return null

  return (
    <>
      <div ref={overlayRef} className={styles.overlay} />
      <span ref={dotRef} className={styles.dot} />
    </>
  )
}
