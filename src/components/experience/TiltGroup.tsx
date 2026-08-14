'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'

import { usePointerTilt } from './usePointerTilt'

/** Wraps children in a group that gently tilts toward the pointer while
 * focused, the same mouse-follow feel (and amplitude) VaultSceneModel uses
 * for its own model. */
export default function TiltGroup({ focused, children }: { focused: boolean; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const tilt = usePointerTilt()

  useFrame(() => {
    if (!groupRef.current) return
    const current = tilt.update()
    groupRef.current.rotation.y = focused ? current.y * 0.16 : 0
    groupRef.current.rotation.x = focused ? current.x * 0.1 : 0
  })

  return <group ref={groupRef}>{children}</group>
}
