'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'

const TARGET_SIZE = 1

/** Renders a crate with two hinged doors and glowing "content" slabs inside.
 * Both the door swing and the glow are driven by a single eased progress
 * value toward `active` (focused or hovered) vs. away from it, the same
 * exponential ease-toward-target used for the Figma stack's spread, so it's
 * smooth and reverses cleanly from wherever it's interrupted rather than
 * snapping. No other motion: idle is just the closed resting pose. */
export default function CrateModel({
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
  const [hovered, setHovered] = useState(false)
  const active = focused || hovered

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 3, step: 0.01 },
      rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      doorOpenAngle: { value: 105, min: 0, max: 160, step: 1 },
      easeSpeed: { value: 6, min: 0.5, max: 20, step: 0.1 },
      glowIntensity: { value: 2.5, min: 0, max: 6, step: 0.1 },
    },
    { store: debugStore ?? undefined },
  )

  const modelWrapRef = useRef<THREE.Group>(null)
  const doorLeftRef = useRef<THREE.Object3D | null>(null)
  const doorRightRef = useRef<THREE.Object3D | null>(null)
  const glowMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const activeAmountRef = useRef(0)

  useEffect(() => {
    let doorLeft: THREE.Object3D | null = null
    let doorRight: THREE.Object3D | null = null
    let glowMaterial: THREE.MeshStandardMaterial | null = null

    scene.traverse((child) => {
      if (child.name === 'DoorLeft') doorLeft = child
      if (child.name === 'DoorRight') doorRight = child
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && child.name.startsWith('ContentSlab_')) {
        glowMaterial = mesh.material as THREE.MeshStandardMaterial
      }
    })

    doorLeftRef.current = doorLeft
    doorRightRef.current = doorRight
    glowMaterialRef.current = glowMaterial

    // The glb ships a plain (non-emissive) material for the slabs, so this
    // makes it glow-capable, keyed off its own base color, without needing
    // an emissive texture baked in.
    if (glowMaterial) {
      ;(glowMaterial as THREE.MeshStandardMaterial).emissive.copy(
        (glowMaterial as THREE.MeshStandardMaterial).color,
      )
      ;(glowMaterial as THREE.MeshStandardMaterial).emissiveIntensity = 0
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
  }, [scene, tuning.targetSize, tuning.rotationX, tuning.rotationY, tuning.rotationZ])

  useFrame((_, delta) => {
    const target = active ? 1 : 0
    activeAmountRef.current +=
      (target - activeAmountRef.current) * (1 - Math.exp(-tuning.easeSpeed * delta))
    const amount = activeAmountRef.current
    const openAngleRad = THREE.MathUtils.degToRad(tuning.doorOpenAngle)

    // Hinges sit at each door's outer edge with the panel extending inward,
    // so the two doors need opposite-signed rotation to swing outward and
    // forward symmetrically instead of into each other.
    if (doorLeftRef.current) doorLeftRef.current.rotation.y = -amount * openAngleRad
    if (doorRightRef.current) doorRightRef.current.rotation.y = amount * openAngleRad

    if (glowMaterialRef.current) {
      glowMaterialRef.current.emissiveIntensity = amount * tuning.glowIntensity
    }
  })

  return (
    <group scale={scale}>
      <group
        ref={modelWrapRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <primitive object={scene} />
      </group>
    </group>
  )
}
