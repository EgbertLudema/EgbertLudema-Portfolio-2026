'use client'

import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { applyScreenTexture } from './applyScreenTexture'
import { BROWSER_WINDOW_ASPECT, useBrowserWindowTexture } from './useBrowserWindowTexture'
import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'
import TiltGroup from './TiltGroup'

const TARGET_SIZE = 1.5

/** Renders the portfolio monitor model with a project's screenshot
 * composited into a little browser-window mockup (traffic-light dots, an
 * address bar) on its "Monitor_Screen" mesh, lit up like a real backlit
 * display. With no photo set, the screen keeps the glb's own placeholder
 * gradient. */
export default function MonitorModel({
  modelUrl,
  screenImageUrl,
  focused,
  scale = 1,
  label,
}: {
  modelUrl: string
  screenImageUrl?: string
  focused: boolean
  scale?: number
  /** This project's title, becomes this instance's own Leva folder, so
   * every model gets independent sliders rather than sharing one bucket
   * with every other project of the same kind. */
  label: string
}) {
  const { scene } = useGLTF(modelUrl)
  const debugStore = useDebugStore()
  const screenTexture = useBrowserWindowTexture(screenImageUrl)

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 3, step: 0.01 },
      // The glb already ships standing upright, screen facing the camera
      // (+Z), so unlike the phone this needs no base rotation.
      rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
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
      if (mesh.isMesh && child.name === 'Monitor_Screen') screenMesh = mesh
    })

    if (screenMesh) {
      const mesh: THREE.Mesh = screenMesh

      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      const box = mesh.geometry.boundingBox
      const size = box ? box.getSize(new THREE.Vector3()) : null
      // The Monitor_Screen plane lies flat in the XY plane (normal +Z), so
      // unlike the phone's plane, width/height map directly to size.x/size.y.
      const screenAspect = size && size.y > 0 ? size.x / size.y : BROWSER_WINDOW_ASPECT

      // The composite is always drawn at a fixed 16:9 (matching the
      // screen's own aspect), so it fills edge to edge with no further
      // cropping/letterboxing needed here.
      applyScreenTexture(mesh, screenTexture, screenAspect, BROWSER_WINDOW_ASPECT)
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
  }, [scene, screenTexture, tuning.targetSize, tuning.rotationX, tuning.rotationY, tuning.rotationZ])

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
