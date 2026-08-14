'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'

/** Loads `url` as a texture (or clears to `null` when `url` is undefined),
 * without suspending — used for optional, Payload-uploaded "screen" photos
 * where no image is a valid, common state rather than a loading error. */
export function useUrlTexture(url?: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!url) {
      setTexture(null)
      return
    }
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(url, (loaded) => {
      if (cancelled) return
      loaded.colorSpace = THREE.SRGBColorSpace
      setTexture(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  return texture
}
