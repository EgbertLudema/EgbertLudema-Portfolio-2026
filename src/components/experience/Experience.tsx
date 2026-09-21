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
// How long to wait after the last wheel event before treating the scroll
// gesture as "released" and snapping, same as lifting a finger/mouse off a
// drag: a trackpad's inertial scroll keeps sending smaller and smaller
// events for a while, so this only needs to bridge the gap between them,
// not match how long the whole gesture visually takes to decay.
const WHEEL_IDLE_MS = 220
// Scales a wheel event's raw deltaY/X down before it's added to the same
// drag distance a pointer/touch gesture accumulates: a wheel notch or
// trackpad tick reports a much larger delta than the equivalent finger
// movement would, which read as a much faster, twitchier scroll than a drag.
const WHEEL_SENSITIVITY = 0.6
// How far past the first/last card the row can be pulled, in card-widths,
// no matter how hard or how long the gesture keeps pulling: the resistance
// curve below approaches this asymptotically rather than hitting it as a
// hard wall, so the give itself feels soft, not just short.
const MAX_OVERSCROLL_CARDS = 0.3
// How far into the next card a gesture has to travel before releasing
// commits to it. Deliberately below the half-card a plain Math.round would
// use: one notch of a typical mouse wheel accumulates ~0.43 cards (100 raw
// deltaY, scaled by WHEEL_SENSITIVITY, over DRAG_PIXELS_PER_CARD), so a
// clear single-notch scroll used to fall just short and rubber-band right
// back to the card it started from. Still sits comfortably above
// MAX_OVERSCROLL_CARDS, so pulling against the first or last card can
// never commit past the end of the row.
const SNAP_COMMIT_CARDS = 0.35
const MAX_CANVAS_RECOVERIES = 5
// Pixels per second the travel dot flies at, kept constant regardless of a
// leg's direction so a mostly-horizontal hop (a big title-length jump)
// doesn't visibly outrun a mostly-vertical one.
const DOT_SPEED = 550

/** Dampens a raw (unresisted) drag distance once it would carry the row
 * past the first or last card, so pulling further keeps giving a little
 * but with steeply diminishing returns instead of scrolling on forever.
 * Mutates `isOverscrolledRef` as a side effect so callers can tell whether
 * the *current* position is past a bound, for picking a bouncier settle
 * ease on release (see Row's settle tween in Scene.tsx). */
function applyOverscrollResistance(
  rawPx: number,
  activeIndex: number,
  itemCount: number,
  isOverscrolledRef: React.RefObject<boolean>,
): number {
  const rawCardUnits = rawPx / DRAG_PIXELS_PER_CARD
  const virtualIndex = activeIndex + rawCardUnits
  const maxIndex = itemCount - 1

  let overshoot = 0
  if (virtualIndex < 0) overshoot = -virtualIndex
  else if (virtualIndex > maxIndex) overshoot = virtualIndex - maxIndex

  isOverscrolledRef.current = overshoot > 0
  if (overshoot === 0) return rawPx

  // Hyperbolic falloff: resisted -> MAX_OVERSCROLL_CARDS as overshoot grows,
  // rather than clamping outright, so the last bit of give tapers off
  // smoothly instead of the drag suddenly refusing to move any further.
  const resisted = (MAX_OVERSCROLL_CARDS * overshoot) / (overshoot + MAX_OVERSCROLL_CARDS)
  // Both branches are "the rawCardUnits that would land exactly on the
  // boundary index, plus a little more past it": missing the `-activeIndex`
  // term on this first branch meant it resisted back toward wherever the
  // drag started instead of toward index 0, making index 0 unreachable from
  // any other starting card.
  const clampedCardUnits = virtualIndex < 0 ? -activeIndex - resisted : maxIndex - activeIndex + resisted
  return clampedCardUnits * DRAG_PIXELS_PER_CARD
}

/** Whole cards a gesture's accumulated (already-resisted) distance should
 * advance the row by. Shared by the release commit and the live title
 * readout so the title never names a card the release then declines to
 * actually move to. */
function cardsMovedFrom(px: number) {
  const cards = px / DRAG_PIXELS_PER_CARD
  const whole = Math.trunc(cards)
  const fraction = cards - whole
  if (fraction > SNAP_COMMIT_CARDS) return whole + 1
  if (fraction < -SNAP_COMMIT_CARDS) return whole - 1
  return whole
}

export type ContactInfo = {
  email: string
  socials: { id: string; label: string; url: string }[]
}

export default function Experience({
  items,
  locale,
  contact,
  onReady,
}: {
  items: ExperienceItem[]
  locale: Locale
  contact: ContactInfo
  /** Fired once the scene has an actual rendered frame on screen (or,
   * immediately, if there's no scene to render at all) so the caller can
   * dismiss its loading screen. See Scene's own onReady. */
  onReady?: () => void
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
  const wheelIdleTimeoutRef = useRef<number | null>(null)
  // Shared by touch (finger), pointer (mouse/pen) drag, and now wheel: all
  // three feed the same live-follow + snap system, see Row's useFrame in
  // Scene.tsx.
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  // Positive = dragged toward "next" (finger/cursor moving left or up),
  // whichever axis is currently dominant, letting the same gesture read as
  // either a horizontal swipe or a vertical scroll, since both should
  // navigate.
  const dragForwardPx = useRef(0)
  // Wheel-only: the true, unresisted running total (wheel deltas arrive
  // incrementally, unlike a pointer/touch's absolute position-vs-start
  // delta), so resistance is always computed from the real distance rather
  // than compounding on top of an already-resisted value.
  const wheelRawForwardPx = useRef(0)
  // Whether the row is currently pulled past the first/last card, set as a
  // side effect of applyOverscrollResistance: read on release to pick a
  // bouncier settle ease, see Row's settle tween in Scene.tsx.
  const isOverscrolledRef = useRef(false)
  const isDraggingRef = useRef(false)
  // Which input owns the in-flight gesture. A wheel has no real start
  // position, so onWheel fakes one at {0, 0} purely to mark a session
  // active - and `pointermove` is bound to the window unconditionally, so
  // without this every mouse movement during a wheel scroll fell through
  // to updateDrag, measured the cursor against that fake origin, and
  // reported a drag the size of the cursor's distance from the top-left
  // corner: several cards' worth, always backwards, so the release
  // committed a jump to the first card.
  const gestureSourceRef = useRef<'pointer' | 'wheel' | null>(null)
  const recoveryCountRef = useRef(0)
  const listRef = useRef<HTMLElement>(null)
  const travelDotRef = useRef<HTMLSpanElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const prevActiveIndexRef = useRef(activeIndex)

  // Which item's title/category/description is live-tracked as "nearest"
  // while scrolling/dragging (updates continuously, before a card is
  // actually committed), and which one is currently painted in the
  // bottomCenter block (lags behind displayIndex by one crossfade-out, so
  // the old title finishes fading before the new one swaps in). See the
  // effects below and bottomCenterRef's crossfade.
  const [displayIndex, setDisplayIndex] = useState(activeIndex)
  const [renderedIndex, setRenderedIndex] = useState(activeIndex)
  const displayIndexRef = useRef(activeIndex)
  const bottomCenterRef = useRef<HTMLDivElement>(null)
  const bottomCenterTweenRef = useRef<gsap.core.Tween | null>(null)

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
    // Not dragging: displayIndex should always match whatever was actually
    // committed (a settled drag/wheel release via jumpTo, or a keyboard
    // step), rather than trusting the rAF loop below, which only runs
    // while `dragging` is true and so misses commits that never dragged at
    // all (arrow keys, clicking a list item).
    if (dragging) return
    displayIndexRef.current = activeIndex
    setDisplayIndex(activeIndex)
  }, [activeIndex, dragging])

  useEffect(() => {
    // Live-tracks which card is currently nearest while a drag/wheel/touch
    // gesture is in progress, using the exact same rounding CardItem and
    // endDrag use to decide the "nearest" card from accumulated drag
    // distance, so the title swaps at the same moment a card's focus does
    // rather than only once the gesture ends and commits.
    if (!dragging) return
    let raf = 0
    const tick = () => {
      // endDrag() flips this ref synchronously, immediately, the instant a
      // gesture ends - well before React re-renders with dragging=false and
      // actually runs this effect's cleanup below. Without this check, a
      // frame that was already queued can still fire in that gap and read
      // dragForwardPx after endDrag has already reset it to 0 but before
      // activeIndexRef has caught up to the just-committed index, computing
      // a bogus "liveIndex" from stale/zeroed inputs and yanking the title
      // back to the old card for a frame before the commit effect corrects
      // it - the exact flicker this guard closes.
      if (!isDraggingRef.current) return
      const liveIndex = Math.max(
        0,
        Math.min(items.length - 1, activeIndexRef.current + cardsMovedFrom(dragForwardPx.current)),
      )
      if (liveIndex !== displayIndexRef.current) {
        displayIndexRef.current = liveIndex
        setDisplayIndex(liveIndex)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dragging, items.length])

  useEffect(() => {
    // Crossfades the bottomCenter block to whatever displayIndex just
    // became: fades the current text out, swaps the rendered item once
    // it's invisible (renderedIndex, read by the JSX below), then the
    // effect keyed on renderedIndex fades the new text back in. Restarting
    // (rather than queuing) on a fast run of index changes means a quick
    // flick through several cards only shows the one it actually settles
    // near for a moment, not every card it technically passed through.
    if (displayIndex === renderedIndex) return
    const el = bottomCenterRef.current
    if (!el) {
      setRenderedIndex(displayIndex)
      return
    }
    bottomCenterTweenRef.current?.kill()
    bottomCenterTweenRef.current = gsap.to(el, {
      opacity: 0,
      y: 8,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => setRenderedIndex(displayIndex),
    })
  }, [displayIndex, renderedIndex])

  useEffect(() => {
    const el = bottomCenterRef.current
    if (!el) return
    bottomCenterTweenRef.current?.kill()
    bottomCenterTweenRef.current = gsap.fromTo(
      el,
      { opacity: 0, y: 10, xPercent: -50 },
      { opacity: 1, y: 0, xPercent: -50, duration: 0.28, ease: 'power2.out' },
    )
  }, [renderedIndex])

  useEffect(() => {
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
      // Once scrolled down into the mobile footer, there's nothing to
      // swipe, so leave the gesture to native scroll entirely rather than
      // starting a carousel drag that has no visible row to follow.
      // A real grab takes over from any wheel session still winding down,
      // rather than the two sharing one accumulator: that session's pending
      // idle timeout would otherwise fire mid-drag and commit a snap.
      if (wheelIdleTimeoutRef.current !== null) {
        window.clearTimeout(wheelIdleTimeoutRef.current)
        wheelIdleTimeoutRef.current = null
      }
      gestureSourceRef.current = 'pointer'
      dragStart.current = { x, y }
      dragForwardPx.current = 0
      wheelRawForwardPx.current = 0
      isDraggingRef.current = true
      setDragging(true)
    }

    // Continuously tracked (not just start/end) so the row can live-follow
    // the finger/cursor: see Row's useFrame in Scene.tsx. Picks whichever
    // axis (horizontal swipe or vertical scroll) has moved further so far,
    // so either gesture drives the same "forward" direction, except touch
    // on mobile, where vertical is left to the browser's native scroll
    // (down to the footer) instead of also paging the carousel; see the
    // `.stage` touch-action: pan-y swap in Experience.module.css.
    const updateDrag = (x: number, y: number, isTouch: boolean) => {
      if (menuOpenRef.current || !dragStart.current) return
      // Only a pointer/touch gesture has a real origin to measure against;
      // see gestureSourceRef.
      if (gestureSourceRef.current !== 'pointer') return
      const dx = dragStart.current.x - x
      const dy = dragStart.current.y - y
      const horizontalDominant = Math.abs(dx) > Math.abs(dy)
      dragForwardPx.current = applyOverscrollResistance(
        horizontalDominant ? dx : dy,
        activeIndexRef.current,
        items.length,
        isOverscrolledRef,
      )
    }

    const endDrag = () => {
      const wasDragging = dragStart.current !== null
      if (wheelIdleTimeoutRef.current !== null) {
        window.clearTimeout(wheelIdleTimeoutRef.current)
        wheelIdleTimeoutRef.current = null
      }
      gestureSourceRef.current = null
      dragStart.current = null
      isDraggingRef.current = false
      setDragging(false)
      setReleaseTick((tick) => tick + 1)
      if (menuOpenRef.current || !wasDragging) {
        dragForwardPx.current = 0
        wheelRawForwardPx.current = 0
        return
      }
      // Reads the already-resisted (not raw) distance: an overscroll past
      // the last/first card asymptotically approaches MAX_OVERSCROLL_CARDS,
      // which sits below SNAP_COMMIT_CARDS, so this always resolves back to
      // the boundary index itself rather than ever proposing one past it.
      const cardsMoved = cardsMovedFrom(dragForwardPx.current)
      dragForwardPx.current = 0
      wheelRawForwardPx.current = 0
      if (cardsMoved !== 0) {
        const target = Math.max(0, Math.min(items.length - 1, activeIndexRef.current + cardsMoved))
        jumpTo(target)
      }
    }

    // Feeds the wheel gesture into the exact same live-follow + snap session
    // as a pointer/touch drag, rather than the old "accumulate, then jump a
    // whole card the instant a threshold is crossed" behavior: that read as
    // a hard snap per notch instead of a smooth, continuous scroll. A wheel
    // has no absolute start position the way a pointer/touch does, so this
    // fakes one with a sentinel just to mark a session as active for
    // endDrag's own `wasDragging` check.
    const onWheel = (event: WheelEvent) => {
      if (menuOpenRef.current) return
      // A held pointer/touch drag wins: folding wheel deltas into its
      // absolute position-vs-start distance would just fight the finger.
      if (gestureSourceRef.current === 'pointer') return
      event.preventDefault()
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (dragStart.current === null) {
        gestureSourceRef.current = 'wheel'
        dragStart.current = { x: 0, y: 0 }
        dragForwardPx.current = 0
        wheelRawForwardPx.current = 0
        isDraggingRef.current = true
        setDragging(true)
      }
      wheelRawForwardPx.current += delta * WHEEL_SENSITIVITY
      dragForwardPx.current = applyOverscrollResistance(
        wheelRawForwardPx.current,
        activeIndexRef.current,
        items.length,
        isOverscrolledRef,
      )
      if (wheelIdleTimeoutRef.current !== null) {
        window.clearTimeout(wheelIdleTimeoutRef.current)
      }
      // No native "wheel end" event exists, so idle-detect it: keep pushing
      // this timeout out on every event, and once it actually fires,
      // nothing has arrived in a while, meaning the gesture is over.
      wheelIdleTimeoutRef.current = window.setTimeout(() => {
        wheelIdleTimeoutRef.current = null
        endDrag()
      }, WHEEL_IDLE_MS)
    }

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) beginDrag(touch.clientX, touch.clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) updateDrag(touch.clientX, touch.clientY, true)
    }

    const onTouchEnd = () => endDrag()

    // Mouse/pen click-and-drag, as an alternative to the wheel: touch
    // already gets its own gesture via the touch handlers above, so this
    // skips `pointerType === 'touch'` rather than double-handling it.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      beginDrag(event.clientX, event.clientY)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      updateDrag(event.clientX, event.clientY, false)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (gestureSourceRef.current !== 'pointer') return
      endDrag()
    }

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (gestureSourceRef.current !== 'pointer') return
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
      if (wheelIdleTimeoutRef.current !== null) window.clearTimeout(wheelIdleTimeoutRef.current)
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
  // The bottomCenter block reads from this instead of `active` directly, so
  // its title/category/description only swap once the crossfade-out above
  // has actually hidden the old text (see renderedIndex's effects).
  const displayedItem = items[renderedIndex] ?? active

  useEffect(() => {
    // Nothing to render, so there's no Scene to wait on: dismiss the
    // loading screen immediately rather than leaving it stuck forever.
    if (!active) onReady?.()
  }, [active, onReady])

  useEffect(() => {
    // WebGL failed every recovery attempt before ever rendering a frame
    // (see handleContextLost): same reasoning, nothing left to wait on.
    if (canvasGaveUp) onReady?.()
  }, [canvasGaveUp, onReady])

  // Shared by the pinned desktop footer, the hamburger menu's footer, and
  // the mobile scroll-to-reveal footer below: same mail/socials content in
  // three different layout contexts.
  const footerLinks = (
    <>
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
    </>
  )

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
        <div className={styles.heroScreen}>
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
                onReady={onReady}
                dragForwardPx={dragForwardPx}
                isDragging={isDraggingRef}
                isOverscrolled={isOverscrolledRef}
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
                <span
                  className={`${styles.menuToggleBars} ${menuOpen ? styles.menuToggleOpen : ''}`}
                >
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
                      exists while the menu is already open), keeping both
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
                  <div className={styles.menuFooterLinks}>{footerLinks}</div>
                  <span className={styles.bottomBarCopyright}>&copy; {year} Egbert Ludema</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.bottomLeft}>
            <span className={styles.index}>
              {String(renderedIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <span>{t.home.scrollHint}</span>
          </div>

          <div className={styles.bottomCenter} ref={bottomCenterRef}>
            <p className={styles.category}>{displayedItem.category}</p>
            <h1 className={styles.title}>{displayedItem.title}</h1>
            <p className={styles.description}>{displayedItem.description}</p>
            <TransitionLink href={`/projects/${displayedItem.slug}`} className={styles.viewProject}>
              {t.home.viewProject}
              <span aria-hidden="true">&rarr;</span>
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
            <div className={styles.bottomBarLinks}>{footerLinks}</div>
            <span className={styles.bottomBarCopyright}>&copy; {year} Egbert Ludema</span>
          </footer>
        </div>

      </main>
    </DebugStoreProvider>
  )
}
