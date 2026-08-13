'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'

const TARGET_SIZE = 1

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}
function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t)
}
function easeInQuad(t: number) {
  return t * t
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/** A multiple of 90° on each axis: a cube looks equally "landed flat" at
 * any of these, so picking one at random is enough to fake a real dice
 * settling on a face without needing to know its actual pip layout. */
function randomAxisAlignedQuat(): THREE.Quaternion {
  const snap = () => Math.floor(Math.random() * 4) * (Math.PI / 2)
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(snap(), snap(), snap()))
}

type ThrowState = {
  spin: THREE.Vector3
  /** Position/rotation this throw lifts off from: wherever the last throw
   * left it, not the model's original origin, so consecutive throws don't
   * snap back before tumbling again. */
  startOffset: THREE.Vector2
  startQuat: THREE.Quaternion
  rollOffset: THREE.Vector2
  landedQuat: THREE.Quaternion
}

/** Renders a single-mesh die and, each time the card becomes focused, plays
 * a toss-and-settle: thrown straight up a little, falls back down onto an
 * invisible surface at its resting height, then tumbles/skids to a stop,
 * and just stays there. It never resets on its own; the only way to throw
 * it again is to unfocus and refocus the card (a fresh page load is the
 * only thing that puts it back at its original pose). */
export default function DiceModel({
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
  const { clock } = useThree()
  const debugStore = useDebugStore()

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 3, step: 0.01 },
      rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      throwHeight: { value: 0.35, min: 0, max: 1, step: 0.01 },
      launchDuration: { value: 0.22, min: 0.05, max: 1, step: 0.01 },
      fallDuration: { value: 0.3, min: 0.05, max: 1, step: 0.01 },
      rollDuration: { value: 0.6, min: 0.1, max: 2, step: 0.01 },
      rollOffsetRadius: { value: 0.15, min: 0, max: 1, step: 0.01 },
    },
    { store: debugStore ?? undefined },
  )

  const outerRef = useRef<THREE.Group>(null)
  const modelWrapRef = useRef<THREE.Group>(null)
  const sequenceStartRef = useRef<number | null>(null)
  const throwStateRef = useRef<ThrowState>({
    spin: new THREE.Vector3(10, 11, 9),
    startOffset: new THREE.Vector2(0, 0),
    startQuat: new THREE.Quaternion(),
    rollOffset: new THREE.Vector2(0, 0),
    landedQuat: new THREE.Quaternion(),
  })
  // Where the die is currently resting, updated once a throw settles, and
  // where the next throw's launch/fall phases lift off from.
  const restOffsetRef = useRef(new THREE.Vector2(0, 0))
  const restQuatRef = useRef(new THREE.Quaternion())
  const tumbleQuatRef = useRef(new THREE.Quaternion())

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
  }, [scene, tuning.targetSize, tuning.rotationX, tuning.rotationY, tuning.rotationZ])

  useEffect(() => {
    if (!focused) return
    sequenceStartRef.current = clock.elapsedTime
    const randomSign = () => (Math.random() < 0.5 ? -1 : 1)
    throwStateRef.current = {
      spin: new THREE.Vector3(
        (8 + Math.random() * 6) * randomSign(),
        (8 + Math.random() * 6) * randomSign(),
        (8 + Math.random() * 6) * randomSign(),
      ),
      // Lifts off from wherever it's currently resting, not the origin:
      // repeated throws pick back up from the last landing spot.
      startOffset: restOffsetRef.current.clone(),
      startQuat: restQuatRef.current.clone(),
      rollOffset: new THREE.Vector2(
        (Math.random() * 2 - 1) * tuning.rollOffsetRadius,
        (Math.random() * 2 - 1) * tuning.rollOffsetRadius,
      ),
      landedQuat: randomAxisAlignedQuat(),
    }
    // Only the trigger (focused turning on) matters: rollOffsetRadius is
    // read at that moment, not something a mid-throw slider change should
    // restart the sequence for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused])

  useFrame((state) => {
    const group = outerRef.current
    const seqStart = sequenceStartRef.current
    if (!group || seqStart === null) return

    const { launchDuration, fallDuration, rollDuration, throwHeight } = tuning
    const launchEnd = launchDuration
    const fallEnd = launchEnd + fallDuration
    const rollEnd = fallEnd + rollDuration

    const t = state.clock.elapsedTime - seqStart
    const { spin, startOffset, startQuat, rollOffset, landedQuat } = throwStateRef.current

    // Continuous tumble while airborne, layered on top of wherever this
    // throw lifted off from, freezing at its fallEnd value once grounded
    // since airborneT stops advancing past that point, so the roll phase
    // below always slerps from a stable "just landed" orientation.
    const airborneT = Math.min(t, fallEnd)
    tumbleQuatRef.current
      .setFromEuler(new THREE.Euler(spin.x * airborneT, spin.y * airborneT, spin.z * airborneT))
      .premultiply(startQuat)

    let x = startOffset.x
    let y = 0
    let z = startOffset.y

    if (t <= launchEnd) {
      y = throwHeight * easeOutQuad(clamp01(launchDuration > 0 ? t / launchDuration : 1))
      group.quaternion.copy(tumbleQuatRef.current)
    } else if (t <= fallEnd) {
      const localT = clamp01(fallDuration > 0 ? (t - launchEnd) / fallDuration : 1)
      y = throwHeight * (1 - easeInQuad(localT))
      group.quaternion.copy(tumbleQuatRef.current)
    } else if (t <= rollEnd) {
      const localT = clamp01(rollDuration > 0 ? (t - fallEnd) / rollDuration : 1)
      // A couple of decaying bounces on landing, on top of the skid.
      y = Math.exp(-4 * localT) * Math.abs(Math.sin(localT * Math.PI * 3)) * throwHeight * 0.25
      const slideT = easeOutCubic(localT)
      x = startOffset.x + rollOffset.x * slideT
      z = startOffset.y + rollOffset.y * slideT
      group.quaternion.slerpQuaternions(tumbleQuatRef.current, landedQuat, easeOutCubic(localT))
    } else {
      // Settled: freeze here for good. This is now the base the next
      // throw (next focus) lifts off from, and no further per-frame work
      // is needed until that happens.
      x = startOffset.x + rollOffset.x
      z = startOffset.y + rollOffset.y
      y = 0
      group.quaternion.copy(landedQuat)
      restOffsetRef.current.set(x, z)
      restQuatRef.current.copy(landedQuat)
      sequenceStartRef.current = null
    }

    group.position.set(x, y, z)
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
