'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'

// Amplitudes and speeds lifted from the vault's own idle wobble, which used
// to be the only thing in the scene that had one (see VaultSceneModel's
// per-model `ambientSway` flag, now gone: every card sways, so there is one
// implementation here instead of a flag each model opts into).
const SWAY_SPEED = 0.35
const SWAY_AMOUNT = 0.05
const BOB_SPEED = 0.5
const BOB_AMOUNT = 0.018
const BOB_Y_SPEED = 0.8
const BOB_Y_AMOUNT = 0.035

/** Deterministic 0..1 from an item's id, so a card's sway phase is stable
 * across re-renders and reloads (unlike Math.random) but still unrelated to
 * its neighbours'. */
export function swayPhaseFromId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

/** Gentle, never-ending idle wobble, running regardless of focus or of
 * whatever the wrapped content animates internally.
 *
 * Deliberately its own group nested inside the card rather than folded into
 * an existing one: CardItem's outer group is already driven by the focus
 * tweens and the live drag proximity math, and several models (the die's
 * throw, the node graph, the figma stack) fully own their own inner
 * transform every frame. Sitting between the two leaves both untouched.
 *
 * `phase` offsets each card along the same curves so the row doesn't drift
 * in lockstep, which reads as the whole row hanging off one hinge. */
export default function AmbientSway({
  phase = 0,
  children,
}: {
  phase?: number
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const elapsed = state.clock.elapsedTime + phase * Math.PI * 2
    groupRef.current.rotation.y = Math.sin(elapsed * SWAY_SPEED) * SWAY_AMOUNT
    groupRef.current.rotation.x = Math.sin(elapsed * BOB_SPEED) * BOB_AMOUNT
    groupRef.current.position.y = Math.sin(elapsed * BOB_Y_SPEED) * BOB_Y_AMOUNT
  })

  return <group ref={groupRef}>{children}</group>
}
