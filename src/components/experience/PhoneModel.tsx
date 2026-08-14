'use client'

import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { applyScreenTexture } from './applyScreenTexture'
import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'
import TiltGroup from './TiltGroup'
import { useUrlTexture } from './useUrlTexture'

const TARGET_SIZE = 1.5
const FALLBACK_SCREEN_ASPECT = 9 / 19.5

/** Renders the smartphone model with a project's homescreen photo mapped
 * onto its "Screen" mesh, lit up like a real backlit display. With no
 * photo set, the screen keeps whatever material the glb ships with (a
 * plain "off" look). */
export default function PhoneModel({
  modelUrl,
  screenImageUrl,
  screenImageAspect,
  focused,
  scale = 1,
  label,
}: {
  modelUrl: string
  screenImageUrl?: string
  screenImageAspect?: number
  focused: boolean
  scale?: number
  /** This project's title, becomes this instance's own Leva folder, so
   * every model gets independent sliders rather than sharing one bucket
   * with every other project of the same kind. */
  label: string
}) {
  const { scene } = useGLTF(modelUrl)
  const debugStore = useDebugStore()
  const screenTexture = useUrlTexture(screenImageUrl)

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 3, step: 0.01 },
      // The glb ships lying flat, screen facing up (+Y). Tipping it +90°
      // around X stands it upright with the screen facing the camera (+Z).
      rotationX: { value: Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    },
    { store: debugStore ?? undefined },
  )

  const modelWrapRef = useRef<THREE.Group>(null)

  useEffect(() => {
    let screenMesh: THREE.Mesh | null = null

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && child.name === 'Screen') screenMesh = mesh
    })

    if (screenMesh) {
      const mesh: THREE.Mesh = screenMesh

      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      const box = mesh.geometry.boundingBox
      const size = box ? box.getSize(new THREE.Vector3()) : null
      // The glb's Screen plane is authored lying flat (width along local
      // X, length along local Z, normal +Y); the +90° X rotation above
      // stands it upright without touching X or the X/Z size ratio, so
      // width/height is size.x / size.z regardless of that rotation.
      const screenAspect = size && size.z > 0 ? size.x / size.z : FALLBACK_SCREEN_ASPECT
      const imageAspect = screenImageAspect ?? screenAspect

      applyScreenTexture(mesh, screenTexture, screenAspect, imageAspect)
    }

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
  }, [
    scene,
    screenTexture,
    screenImageAspect,
    tuning.targetSize,
    tuning.rotationX,
    tuning.rotationY,
    tuning.rotationZ,
  ])

  return (
    <group scale={scale}>
      <TiltGroup focused={focused}>
        <group ref={modelWrapRef}>
          <primitive object={scene} />
        </group>
      </TiltGroup>
    </group>
  )
}
