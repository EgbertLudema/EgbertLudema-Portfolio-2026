import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Procedural placeholder artwork: a soft diagonal gradient with light grain,
 * used until real media exists in the CMS.
 */
export function useGradientTexture(colorA: string, colorB: string) {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, colorA)
    gradient.addColorStop(1, colorB)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    ctx.globalAlpha = 0.05
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = Math.random() * 1.4
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [colorA, colorB])
}
