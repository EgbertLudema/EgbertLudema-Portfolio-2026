'use client'

import gsap from 'gsap'
import { button, LevaPanel, useControls, useCreateStore } from 'leva'
import { useCallback, useEffect, useRef, useState } from 'react'

import LanguageSwitch from '@/components/LanguageSwitch'
import TransitionLink from '@/components/TransitionLink'
import { getDictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import Clock from './Clock'
import { DebugStoreProvider, isDev } from './debugStore'
import styles from './Experience.module.css'
import type { ExperienceItem } from './items'
import Scene, { DRAG_PIXELS_PER_CARD } from './Scene'

const DEBUG_STORAGE_KEY = 'vault-debug-transform-values'

/** Dev-only panel root: owns one shared leva store so every object's
 * `useControls` folder (Camera, Card Group, Vault Model, ...) lands in the
 * same panel, persists slider edits to localStorage across reloads, and
 * offers a one-click export of the current values as JSON. */
function DebugPanel({ store }: { store: ReturnType<typeof useCreateStore> }) {
  useControls(
    'Export',
    {
      'Copy values as JSON': button(() => {
        const flat = Object.fromEntries(
          Object.entries(store.getData()).map(([key, entry]) => [
            key,
            (entry as { value: unknown }).value,
          ]),
        )
        const json = JSON.stringify(flat, null, 2)
        navigator.clipboard.writeText(json).catch(() => {})
        // eslint-disable-next-line no-console
        console.log('[Debug] Current 3D transform values:\n', json)
      }),
    },
    { store },
  )

  useEffect(() => {
    const raw = window.localStorage.getItem(DEBUG_STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Record<string, unknown>
      store.set(saved, false)
    } catch {
      // Corrupt/old-shape localStorage entry: ignore and keep defaults.
    }
    // Runs once on mount, after every child's `useControls` has registered
    // its paths during the initial render pass, so `store.set` finds them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return store.useStore.subscribe(() => {
      const flat = Object.fromEntries(
        Object.entries(store.getData()).map(([key, entry]) => [
          key,
          (entry as { value: unknown }).value,
        ]),
      )
      window.localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(flat))
    })
  }, [store])

  return <LevaPanel store={store} titleBar={{ title: 'Vault Debug' }} />
}

const NAV_LOCK_MS = 750
const WHEEL_THRESHOLD = 45
const MAX_CANVAS_RECOVERIES = 5
// Pixels per second the travel dot flies at, kept constant regardless of a
// leg's direction so a mostly-horizontal hop (a big title-length jump)
// doesn't visibly outrun a mostly-vertical one.
const DOT_SPEED = 550

export type ContactInfo = {
  email: string
  socials: { id: string; label: string; url: string }[]
}

export default function Experience({
  items,
  locale,
  contact,
}: {
  items: ExperienceItem[]
  locale: Locale
  contact: ContactInfo
}) {
  const t = getDictionary(locale)
  const year = new Date().getFullYear()
  const debugStore = useCreateStore()
  const [activeIndex, setActiveIndex] = useState(0)
  const [canvasKey, setCanvasKey] = useState(0)
  const [canvasGaveUp, setCanvasGaveUp] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [releaseTick, setReleaseTick] = useState(0)
  const menuOpenRef = useRef(false)
  const activeIndexRef = useRef(activeIndex)
  const lockRef = useRef(false)
  const wheelAccum = useRef(0)
  // Shared by touch (finger) and pointer (mouse/pen) drag — both feed the
  // same live-follow + snap system, see Row's useFrame in Scene.tsx.
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  // Positive = dragged toward "next" (finger/cursor moving left or up),
  // whichever axis is currently dominant — lets the same gesture read as
  // either a horizontal swipe or a vertical scroll, since both should
  // navigate.
  const dragForwardPx = useRef(0)
  const isDraggingRef = useRef(false)
  const recoveryCountRef = useRef(0)
  const listRef = useRef<HTMLElement>(null)
  const travelDotRef = useRef<HTMLSpanElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const prevActiveIndexRef = useRef(activeIndex)

  const handleContextLost = useCallback(() => {
    if (recoveryCountRef.current >= MAX_CANVAS_RECOVERIES) {
      setCanvasGaveUp(true)
      return
    }
    recoveryCountRef.current += 1
    // A short delay rather than remounting instantly: if the GPU process
    // itself is still restarting, recreating the Canvas immediately would
    // just lose the new context too. Give it a beat.
    window.setTimeout(() => {
      setCanvasKey((key) => key + 1)
    }, 400)
  }, [])

  const unlockAfter = useCallback((ms: number) => {
    lockRef.current = true
    window.setTimeout(() => {
      lockRef.current = false
    }, ms)
  }, [])

  const step = useCallback(
    (direction: 1 | -1) => {
      if (lockRef.current) return
      setActiveIndex((current) => {
        const next = Math.max(0, Math.min(items.length - 1, current + direction))
        if (next !== current) unlockAfter(NAV_LOCK_MS)
        return next
      })
    },
    [unlockAfter],
  )

  const jumpTo = useCallback(
    (index: number) => {
      setActiveIndex((current) => {
        if (index === current) return current
        unlockAfter(NAV_LOCK_MS)
        return index
      })
    },
    [unlockAfter],
  )

  useEffect(() => {
    menuOpenRef.current = menuOpen
  }, [menuOpen])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (menuOpenRef.current) return
      event.preventDefault()
      if (lockRef.current) return
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      wheelAccum.current += delta
      if (Math.abs(wheelAccum.current) > WHEEL_THRESHOLD) {
        step(wheelAccum.current > 0 ? 1 : -1)
        wheelAccum.current = 0
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpenRef.current) {
        setMenuOpen(false)
        return
      }
      if (menuOpenRef.current) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') step(1)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1)
    }

    // Shared by touch and mouse/pen drag below, so both gestures live-follow
    // and snap identically instead of mouse-drag being a silent, no-feedback
    // "did it work?" threshold check.
    const beginDrag = (x: number, y: number) => {
      if (menuOpenRef.current) return
      dragStart.current = { x, y }
      dragForwardPx.current = 0
      isDraggingRef.current = true
      setDragging(true)
    }

    // Continuously tracked (not just start/end) so the row can live-follow
    // the finger/cursor — see Row's useFrame in Scene.tsx. Picks whichever
    // axis (horizontal swipe or vertical scroll) has moved further so far,
    // so either gesture drives the same "forward" direction.
    const updateDrag = (x: number, y: number) => {
      if (menuOpenRef.current || !dragStart.current) return
      const dx = dragStart.current.x - x
      const dy = dragStart.current.y - y
      dragForwardPx.current = Math.abs(dx) > Math.abs(dy) ? dx : dy
    }

    const endDrag = () => {
      const wasDragging = dragStart.current !== null
      dragStart.current = null
      isDraggingRef.current = false
      setDragging(false)
      setReleaseTick((tick) => tick + 1)
      if (menuOpenRef.current || !wasDragging) {
        dragForwardPx.current = 0
        return
      }
      const cardsMoved = Math.round(dragForwardPx.current / DRAG_PIXELS_PER_CARD)
      dragForwardPx.current = 0
      if (cardsMoved !== 0) {
        const target = Math.max(0, Math.min(items.length - 1, activeIndexRef.current + cardsMoved))
        jumpTo(target)
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) beginDrag(touch.clientX, touch.clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) updateDrag(touch.clientX, touch.clientY)
    }

    const onTouchEnd = () => endDrag()

    // Mouse/pen click-and-drag, as an alternative to the wheel — touch
    // already gets its own gesture via the touch handlers above, so this
    // skips `pointerType === 'touch'` rather than double-handling it.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      beginDrag(event.clientX, event.clientY)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      updateDrag(event.clientX, event.clientY)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      endDrag()
    }

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      endDrag()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [step, jumpTo, items.length])

  // Position relative to the list container, not the viewport, so the dot's
  // left/top can be tweened directly without fighting the list's own layout.
  const getDotPosition = useCallback((index: number) => {
    const dot = dotRefs.current[index]
    const container = listRef.current
    if (!dot || !container) return null
    const dotRect = dot.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    return {
      left: dotRect.left - containerRect.left,
      top: dotRect.top - containerRect.top,
    }
  }, [])

  // Snaps the dot to the initial active item on mount/resize, no animation.
  useEffect(() => {
    const place = () => {
      const pos = getDotPosition(activeIndex)
      if (pos && travelDotRef.current) gsap.set(travelDotRef.current, pos)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flies the dot to the new active item by visiting every list item's dot
  // position in between, in order, instead of a straight line that would
  // cut across the other rows: jumping from the first to the last item
  // reads as travelling down the edge of the list, not teleporting.
  useEffect(() => {
    const prevIndex = prevActiveIndexRef.current
    prevActiveIndexRef.current = activeIndex
    const dot = travelDotRef.current
    if (prevIndex === activeIndex || !dot) return

    const direction = activeIndex > prevIndex ? 1 : -1
    const path: number[] = []
    for (let i = prevIndex; i !== activeIndex; i += direction) {
      path.push(i + direction)
    }
    const waypoints = path
      .map((index) => getDotPosition(index))
      .filter((point): point is { left: number; top: number } => point !== null)
    if (waypoints.length === 0) return

    // Reads wherever the dot actually is right now (not just the previous
    // item's stored position), so an interrupted flight (rapid re-clicks
    // kill this same timeline mid-leg) resumes from its real spot instead
    // of jumping back first.
    let fromLeft = Number(gsap.getProperty(dot, 'left')) || 0
    let fromTop = Number(gsap.getProperty(dot, 'top')) || 0

    const tl = gsap.timeline()
    waypoints.forEach((point, index) => {
      const isLast = index === waypoints.length - 1
      const distance = Math.hypot(point.left - fromLeft, point.top - fromTop)
      // Duration follows real pixel distance at a constant speed, so a leg
      // that happens to be mostly horizontal (a big jump in title length)
      // takes the same time per pixel as a mostly-vertical one, instead of
      // both getting the same flat duration and the horizontal one visibly
      // racing ahead. A linear ease on every leg but the last keeps that
      // constant-speed feel through the corners; the last leg gets a soft
      // overshoot-and-settle bounce on arrival.
      const duration = Math.max(distance / DOT_SPEED, isLast ? 0.22 : 0.05)
      tl.to(dot, {
        left: point.left,
        top: point.top,
        duration,
        ease: isLast ? 'back.out(1.7)' : 'none',
      })
      fromLeft = point.left
      fromTop = point.top
    })

    return () => {
      tl.kill()
    }
  }, [activeIndex, getDotPosition])

  const active = items[activeIndex]

  if (!active) {
    return (
      <main className={styles.stage}>
        <div className={styles.bottomCenter}>
          <p className={styles.description}>{t.home.noProjects}</p>
        </div>
      </main>
    )
  }

  return (
    <DebugStoreProvider value={debugStore}>
      {isDev && <DebugPanel store={debugStore} />}
      <main className={`${styles.stage} ${dragging ? styles.stageDragging : ''}`}>
        <div className={styles.canvasWrap}>
          {canvasGaveUp ? (
            <div
              className={styles.bottomCenter}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p className={styles.description}>{t.home.webglError}</p>
            </div>
          ) : (
            <Scene
              key={canvasKey}
              items={items}
              activeIndex={activeIndex}
              onSelect={jumpTo}
              onContextLost={handleContextLost}
              dragForwardPx={dragForwardPx}
              isDragging={isDraggingRef}
              releaseTick={releaseTick}
            />
          )}
        </div>

        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.mark}>
              <span className={styles.markDot} />
              {t.nav.mark}
            </span>
            <Clock locale={locale} />
          </div>
          <div className={styles.topBarRight}>
            <nav className={styles.topNav} aria-label={t.nav.siteNavigation}>
              <TransitionLink href="/about" className={styles.topNavLink}>
                {t.nav.about}
              </TransitionLink>
              <TransitionLink href="/projects" className={styles.topNavLink}>
                {t.nav.projects}
              </TransitionLink>
              <TransitionLink href="/contact" className={styles.topNavLink}>
                {t.nav.contact}
              </TransitionLink>
              <LanguageSwitch locale={locale} />
            </nav>
            <button
              type="button"
              className={styles.menuToggle}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={`${styles.menuToggleBars} ${menuOpen ? styles.menuToggleOpen : ''}`}>
                <span />
                <span />
              </span>
            </button>
          </div>
        </header>

        {menuOpen ? (
          <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)}>
            <div
              className={styles.menuPanel}
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.siteNavigation}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.menuHeader}>
                <span className={styles.mark}>
                  <span className={styles.markDot} />
                  {t.nav.mark}
                </span>
                <button
                  type="button"
                  className={styles.menuClose}
                  aria-label={t.nav.closeMenu}
                  onClick={() => setMenuOpen(false)}
                >
                  {/* Same two-bar icon as the header's hamburger toggle, just
                      permanently in its rotated "X" state (this button only
                      exists while the menu is already open) — keeps both
                      close affordances visually consistent instead of one
                      being a plain "&times;" glyph. */}
                  <span className={`${styles.menuToggleBars} ${styles.menuToggleOpen}`}>
                    <span />
                    <span />
                  </span>
                </button>
              </div>

              <nav className={styles.menuNav} aria-label={t.nav.siteNavigation}>
                <TransitionLink href="/about" className={styles.menuNavLink}>
                  {t.nav.about}
                </TransitionLink>
                <TransitionLink href="/projects" className={styles.menuNavLink}>
                  {t.nav.projects}
                </TransitionLink>
                <TransitionLink href="/contact" className={styles.menuNavLink}>
                  {t.nav.contact}
                </TransitionLink>
              </nav>
              <LanguageSwitch locale={locale} className={styles.menuLanguage} />

              <div className={styles.menuFooter}>
                <div className={styles.menuFooterLinks}>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className={styles.bottomBarLink}>
                      Mail
                    </a>
                  ) : null}
                  {contact.socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.bottomBarLink}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
                <span className={styles.bottomBarCopyright}>&copy; {year} Egbert Ludema</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.bottomLeft}>
          <span className={styles.index}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <span>{t.home.scrollHint}</span>
        </div>

        <div className={styles.bottomCenter} key={active.id}>
          <p className={styles.category}>{active.category}</p>
          <h1 className={styles.title}>{active.title}</h1>
          <p className={styles.description}>{active.description}</p>
          <TransitionLink href={`/projects/${active.slug}`} className={styles.viewProject}>
            {t.home.viewProject} &rarr;
          </TransitionLink>
        </div>

        <nav className={styles.list} aria-label={t.nav.projectList} ref={listRef}>
          <span className={styles.travelDot} ref={travelDotRef} />
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.listItem} ${index === activeIndex ? styles.listItemActive : ''}`}
              onClick={() => jumpTo(index)}
            >
              <span
                className={styles.listDot}
                ref={(el) => {
                  dotRefs.current[index] = el
                }}
              />
              {item.title}
            </button>
          ))}
        </nav>

        <footer className={styles.bottomBar}>
          <div className={styles.bottomBarLinks}>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className={styles.bottomBarLink}>
                Mail
              </a>
            ) : null}
            {contact.socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bottomBarLink}
              >
                {social.label}
              </a>
            ))}
          </div>
          <span className={styles.bottomBarCopyright}>&copy; {year} Egbert Ludema</span>
        </footer>
      </main>
    </DebugStoreProvider>
  )
}
