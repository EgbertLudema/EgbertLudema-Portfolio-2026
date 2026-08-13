'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'

const SPREAD_CLOSED = 0.56
const SPREAD_OPEN = 1.45
const EASE_SPREAD = 6.0
const ROTATION_X = 0.59
const ROTATION_Y = -0.53
const ROTATION_Z = 0.29

// The glb's authored Frame_N positions are the "1.0x" pose this normalizes
// against: closed/open then naturally scale to ~0.45x/1.45x of this
// footprint, so the *closed* card reads at roughly TARGET_SIZE * 0.45.
const TARGET_SIZE = 1.25

const FRAME_NAME = /^Frame_\d+$/

type FrameNode = { node: THREE.Object3D; base: THREE.Vector3 }

/** The stack's `Frame_0..Frame_N` groups are already positioned in the glb
 * at their fully-open "base" offset. Spreading/closing just scales that
 * vector by a 0.45–1.45 multiplier, same as the reference this was rigged
 * against. No idle auto-spin: only mouse-follow tilt while the card is
 * active, and the open/close spread driven by `focused`. */
export default function FigmaStackModel({
  modelUrl,
  focused,
  scale = 1,
  label,
}: {
  modelUrl: string
  focused: boolean
  scale?: number
  /** This project's title, becomes this instance's own Leva folder, so
   * every model gets independent sliders rather than sharing one bucket
   * with every other project of the same kind. */
  label: string
}) {
  const { scene } = useGLTF(modelUrl)
  const debugStore = useDebugStore()

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 3, step: 0.01 },
      rotationX: { value: ROTATION_X, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: ROTATION_Y, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: ROTATION_Z, min: -Math.PI, max: Math.PI, step: 0.01 },
      spreadClosed: { value: SPREAD_CLOSED, min: 0, max: 2, step: 0.01 },
      spreadOpen: { value: SPREAD_OPEN, min: 0, max: 3, step: 0.01 },
      easeSpread: { value: EASE_SPREAD, min: 0.5, max: 20, step: 0.1 },
    },
    { store: debugStore ?? undefined },
  )

  const outerRef = useRef<THREE.Group>(null)
  const modelWrapRef = useRef<THREE.Group>(null)
  const frameNodesRef = useRef<FrameNode[]>([])
  const spreadRef = useRef(tuning.spreadClosed)
  const pointerTiltRef = useRef({ x: 0, y: 0 })
  const currentTiltRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const box = getLocalBoundingBox(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const modelScale = tuning.targetSize / maxDimension

    if (modelWrapRef.current) {
      modelWrapRef.current.scale.setScalar(modelScale)
      const rotationEuler = new THREE.Euler(tuning.rotationX, tuning.rotationY, tuning.rotationZ)
      modelWrapRef.current.rotation.copy(rotationEuler)
      // Rotation happens before translation in the local transform, so the
      // centering offset must be rotated the same way to still land the
      // model's bounding-box center at this group's origin.
      const scaledCenter = center.clone().multiplyScalar(modelScale).applyEuler(rotationEuler)
      modelWrapRef.current.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z)
    }

    const frames: FrameNode[] = []
    scene.traverse((child) => {
      if (!FRAME_NAME.test(child.name)) return
      // Idempotency guard: this effect can re-run on the same cached scene
      // (useGLTF caches by url), only ever capture each frame's authored
      // rest position once, so a second run doesn't re-baseline off an
      // already-animated (mid-spread) position.
      if (!child.userData.baseOffset) {
        child.userData.baseOffset = child.position.clone()
      }
      frames.push({ node: child, base: child.userData.baseOffset as THREE.Vector3 })
    })
    frameNodesRef.current = frames
  }, [scene, tuning.targetSize, tuning.rotationX, tuning.rotationY, tuning.rotationZ])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2
      pointerTiltRef.current.x = Math.max(-1, Math.min(1, y))
      pointerTiltRef.current.y = Math.max(-1, Math.min(1, x))
    }
    const handleBlur = () => {
      pointerTiltRef.current.x = 0
      pointerTiltRef.current.y = 0
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useFrame((_, delta) => {
    const target = focused ? tuning.spreadOpen : tuning.spreadClosed
    spreadRef.current += (target - spreadRef.current) * (1 - Math.exp(-tuning.easeSpread * delta))

    frameNodesRef.current.forEach(({ node, base }) => {
      node.position.copy(base).multiplyScalar(spreadRef.current)
    })

    if (outerRef.current) {
      const tilt = currentTiltRef.current
      const pointerTarget = pointerTiltRef.current
      tilt.x += (pointerTarget.x - tilt.x) * 0.08
      tilt.y += (pointerTarget.y - tilt.y) * 0.08

      outerRef.current.rotation.y = focused ? tilt.y * 0.16 : 0
      outerRef.current.rotation.x = focused ? tilt.x * 0.1 : 0
    }
  })

  return (
    <group scale={scale}>
      <group ref={outerRef}>
        <group ref={modelWrapRef}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  )
}
