'use client'

import { useEffect, useRef } from 'react'

/** Tracks pointer position across the whole window as a normalized [-1, 1]
 * tilt target (same mapping the vault uses), and exposes an `update()` that
 * eases the current value toward it each frame. Call `update()` from inside
 * a `useFrame` callback. */
export function usePointerTilt(easeFactor = 0.08) {
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.3) * 2
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.3) * 2
      targetRef.current.x = Math.max(-1, Math.min(1, y))
      targetRef.current.y = Math.max(-1, Math.min(1, x))
    }
    const handleBlur = () => {
      targetRef.current.x = 0
      targetRef.current.y = 0
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return {
    update() {
      const target = targetRef.current
      const current = currentRef.current
      current.x += (target.x - current.x) * easeFactor
      current.y += (target.y - current.y) * easeFactor
      return current
    },
  }
}
