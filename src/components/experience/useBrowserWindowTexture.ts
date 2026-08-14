'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
export const BROWSER_WINDOW_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT

const CHROME_HEIGHT_RATIO = 0.1
const DOT_COLORS = ['#ff5f57', '#febc2e', '#28c840']

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

/** Draws a minimal browser-window chrome (traffic-light dots, an address
 * bar) with `image` letterboxed into the content area beneath it, so an
 * uploaded site screenshot reads as "a website open in a browser" rather
 * than a bare rectangle of pixels on the monitor. */
function drawBrowserWindow(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const chromeHeight = h * CHROME_HEIGHT_RATIO

  ctx.fillStyle = '#e7e7ec'
  ctx.fillRect(0, 0, w, chromeHeight)
  ctx.strokeStyle = '#d4d4da'
  ctx.lineWidth = Math.max(1, h * 0.003)
  ctx.beginPath()
  ctx.moveTo(0, chromeHeight)
  ctx.lineTo(w, chromeHeight)
  ctx.stroke()

  const dotRadius = chromeHeight * 0.15
  const dotY = chromeHeight / 2
  const dotGap = dotRadius * 2.8
  const dotStartX = chromeHeight * 0.55
  DOT_COLORS.forEach((color, i) => {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(dotStartX + i * dotGap, dotY, dotRadius, 0, Math.PI * 2)
    ctx.fill()
  })

  const barHeight = chromeHeight * 0.5
  const barX = dotStartX + DOT_COLORS.length * dotGap + chromeHeight * 0.4
  const barY = (chromeHeight - barHeight) / 2
  const barWidth = Math.max(0, w - barX - chromeHeight * 0.6)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2)
  ctx.fill()

  const contentY = chromeHeight
  const contentH = h - chromeHeight
  ctx.fillStyle = '#f2f2f5'
  ctx.fillRect(0, contentY, w, contentH)

  if (image.width > 0 && image.height > 0) {
    const imageAspect = image.width / image.height
    const contentAspect = w / contentH
    let drawW: number
    let drawH: number
    // Contain-fit within the content area: the screenshot is pixel-precise
    // UI, so it's letterboxed rather than cropped, same reasoning as the
    // phone's homescreen.
    if (imageAspect > contentAspect) {
      drawW = w
      drawH = w / imageAspect
    } else {
      drawH = contentH
      drawW = contentH * imageAspect
    }
    const drawX = (w - drawW) / 2
    const drawY = contentY + (contentH - drawH) / 2
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
  }
}

/** Composites a project's screenshot into a little browser-window mockup
 * and returns it as a texture sized to a fixed 16:9, matching the
 * monitor's own screen aspect exactly so it always fills it edge to edge.
 * Returns `null` while there's no photo (or it hasn't loaded yet), same as
 * the phone's plain "off" state. */
export function useBrowserWindowTexture(url?: string) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    if (!url) {
      setTexture(null)
      return
    }
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      drawBrowserWindow(canvas, image)

      const loaded = new THREE.CanvasTexture(canvas)
      loaded.colorSpace = THREE.SRGBColorSpace
      loaded.needsUpdate = true
      setTexture(loaded)
    }
    image.src = url

    return () => {
      cancelled = true
    }
  }, [url])

  return texture
}
