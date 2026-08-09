'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Clock from './Clock'
import styles from './Experience.module.css'
import type { ExperienceItem } from './items'
import Scene from './Scene'

const NAV_LOCK_MS = 750
const WHEEL_THRESHOLD = 45
const SWIPE_THRESHOLD = 50
const MAX_CANVAS_RECOVERIES = 5

export default function Experience({ items }: { items: ExperienceItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [canvasKey, setCanvasKey] = useState(0)
  const [canvasGaveUp, setCanvasGaveUp] = useState(false)
  const lockRef = useRef(false)
  const wheelAccum = useRef(0)
  const touchStartX = useRef<number | null>(null)
  const recoveryCountRef = useRef(0)

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
    const onWheel = (event: WheelEvent) => {
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
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') step(1)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step(-1)
    }

    const onTouchStart = (event: TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? null
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartX.current === null) return
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
      const delta = touchStartX.current - endX
      if (Math.abs(delta) > SWIPE_THRESHOLD) step(delta > 0 ? 1 : -1)
      touchStartX.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [step])

  const active = items[activeIndex]

  if (!active) {
    return (
      <main className={styles.stage}>
        <div className={styles.bottomCenter}>
          <p className={styles.description}>
            No projects yet — add some in the Payload admin.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.stage}>
      <div className={styles.canvasWrap}>
        {canvasGaveUp ? (
          <div className={styles.bottomCenter} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className={styles.description}>
              The 3D view keeps crashing on this device — refresh to try again.
            </p>
          </div>
        ) : (
          <Scene
            key={canvasKey}
            items={items}
            activeIndex={activeIndex}
            onSelect={jumpTo}
            onContextLost={handleContextLost}
          />
        )}
      </div>

      <header className={styles.topBar}>
        <span className={styles.mark}>
          <span className={styles.markDot} />
          portfolio
        </span>
        <Clock />
      </header>

      <div className={styles.bottomLeft}>
        <span className={styles.index}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
        <span>scroll · arrows</span>
      </div>

      <div className={styles.bottomCenter} key={active.id}>
        <p className={styles.category}>{active.category}</p>
        <h1 className={styles.title}>{active.title}</h1>
        <p className={styles.description}>{active.description}</p>
      </div>

      <nav className={styles.list} aria-label="Project list">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.listItem} ${index === activeIndex ? styles.listItemActive : ''}`}
            onClick={() => jumpTo(index)}
          >
            <span className={styles.listDot} />
            {item.title}
          </button>
        ))}
      </nav>
    </main>
  )
}
