'use client'

import { useProgress } from '@react-three/drei'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import type { Locale } from '@/lib/locale'
import type { ExperienceItem } from './items'
import type { ContactInfo } from './Experience'
import HomeLoadingScreen from './HomeLoadingScreen'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

// Once nothing is loading, a short settle window before declaring assets
// ready: it's what tells "everything just finished" apart from "nothing
// ever started" (e.g. every model/texture already sat in the browser/loader
// cache from an earlier client-side visit, so the loading manager never
// fires at all) without hardcoding either case - if a load kicks in before
// this elapses, `active` flips true and this timer's own effect re-runs,
// deferring to the same logic once *that* settles instead.
const ASSET_SETTLE_MS = 300
// Safety net: if a model/texture request genuinely hangs (stalls without
// ever reaching its loader's success or error callback), don't leave the
// loading screen up forever waiting for an "idle" signal that may never
// come.
const MAX_ASSET_WAIT_MS = 9000

export default function ExperienceLoader({
  items,
  locale,
  contact,
}: {
  items: ExperienceItem[]
  locale: Locale
  contact: ContactInfo
}) {
  // Three gaps a blank/half-loaded page would otherwise leave: the dynamic
  // import's own download (before `Experience` mounts at all), the moment
  // before the Canvas has actually created a WebGL context and rendered a
  // first frame (see Scene's onReady), and - the one that used to slip
  // through - every card's own model/texture still resolving behind its
  // Suspense fallback. Without waiting on that third gap, the loading
  // screen cleared the instant the canvas existed, revealing a row of
  // plain placeholder boxes that only popped into their real models well
  // after the row's one-shot fall-in animation had already finished
  // playing on an empty wrapper - the vault in particular (the heaviest
  // model) would appear to skip its fall-in entirely and just materialise
  // mid-sequence.
  const [canvasReady, setCanvasReady] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const active = useProgress((state) => state.active)

  useEffect(() => {
    // Gated on canvasReady, not on `active` alone: nothing requests a model
    // or a texture until the Canvas has mounted the card row, and that
    // happens well over ASSET_SETTLE_MS after this component first renders
    // (`Experience` is a dynamic import, so its JS chunk has to download
    // first). Starting the settle window at mount meant it expired against
    // a loading manager that was only idle because no load had started
    // yet, so assetsReady was already true by the time the models actually
    // began loading and the cover lifted on a row of empty placeholders.
    if (!canvasReady || active) return
    const timeout = window.setTimeout(() => setAssetsReady(true), ASSET_SETTLE_MS)
    return () => window.clearTimeout(timeout)
  }, [active, canvasReady])

  useEffect(() => {
    const timeout = window.setTimeout(() => setAssetsReady(true), MAX_ASSET_WAIT_MS)
    return () => window.clearTimeout(timeout)
  }, [])

  const ready = canvasReady && assetsReady

  return (
    <>
      <HomeLoadingScreen ready={ready} />
      <Experience
        items={items}
        locale={locale}
        contact={contact}
        onReady={() => setCanvasReady(true)}
      />
    </>
  )
}
