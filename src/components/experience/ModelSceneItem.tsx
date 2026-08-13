'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import {
  applyDoorItemMeshSpin,
  createDoorItemSpinTarget,
  createMemoryCardStates,
  createMemoryTexture,
  easeOutBack,
  finiteOrFallback,
  getAcceleratedClosingOrbitDistance,
  getAcceleratedClosingOrbitDuration,
  getCombinationDialSpinAmount,
  getForwardAngleDistance,
  getOpenCardOrbitAngle,
  getOrbitPoint,
  getSpinAmount,
  heroMemoryCards,
  memoryCloseDoorDelay,
  memoryCloseDoorDuration,
  memoryClosingFlyInOrbitCarry,
  memoryFacingYawAmount,
  memoryGlobalOrbitStartTime,
  memoryPopDuration,
  memoryPopStartTime,
  memorySettledOrbitSpeed,
  memoryVaultFrontExitPoint,
  smoothstep,
  vaultBaseRotationY,
  vaultDoorOpenDuration,
  vaultDoorOpenRotationY,
  vaultDoorOpenStartTime,
  vaultHandleSpinRadians,
  vaultHandleUnlockSpinDuration,
  vaultHandleUnlockSpinStartTime,
  vaultNumbersCombinationFinalRadians,
  vaultRelockSpinDelay,
  vaultRelockSpinDuration,
  type ClosingCardPlan,
  type DoorItemSpinTarget,
  type MemoryCardState,
} from './vaultHeroLogic'

type ModelTuning = {
  /** Model is uniformly scaled so its largest bounding-box dimension equals this. */
  targetSize: number
  /** Extra nudge applied after centering, on top of the bounding-box center. Negative = down. */
  verticalOffset: number
  /** Static pitch baked into the model itself. */
  rotationX: number
  /** Static yaw baked into the model itself, to fix which way it faces. */
  rotationY: number
  /** Static roll baked into the model itself. */
  rotationZ: number
  /** Gentle continuous idle wobble (sway/bob), always on regardless of focus. */
  ambientSway: boolean
  /** Base tilt applied to outerRef every frame, before sway/tilt are added. */
  outerRotationX: number
  /** Base vertical offset applied to outerRef every frame, before bob is added. */
  outerPositionY: number
}

// Applies to every 3D model EXCEPT the vault (detected below via its
// VaultDoor mesh). Tweak these to change how any other model looks by
// default: e.g. the GoogleAds logo currently uses this untouched.
// Defaults for both are also exposed live in the dev-only Leva panel (see
// useControls calls below), these consts are just the panel's starting
// values and the fallback once nothing has been overridden.
const DEFAULT_MODEL_TUNING: ModelTuning = {
  targetSize: 1,
  verticalOffset: 0,
  rotationX: 0,
  // The GoogleAds glb is exported facing sideways, this turns it to face
  // the camera. Flip the sign if a future model ends up facing the wrong way.
  rotationY: Math.PI / 2,
  rotationZ: 0,
  ambientSway: false,
  outerRotationX: 0.03,
  outerPositionY: -0.08,
}

// Vault-only overrides, layered on top of the defaults above. These values
// were tuned by eye specifically for the vault. Leave DEFAULT_MODEL_TUNING
// alone when adjusting the vault, and vice versa.
const VAULT_MODEL_TUNING: ModelTuning = {
  ...DEFAULT_MODEL_TUNING,
  targetSize: 0.8,
  // The model sits centred on its own bounding-box middle. The card-exit
  // alignment is tuned on the cards' side instead, via MEMORY_VERTICAL_BASELINE
  // in vaultHeroLogic.ts. This offset is a *second*, independent lever: it
  // nudges only the model (not the cards, not outerRef) up/down within its
  // slot. Negative = down. The model and the memory cards are siblings under
  // outerRef, so this is the only way to move the vault body alone without
  // dragging the card orbit with it.
  verticalOffset: -0.65,
  rotationY: 0,
  ambientSway: true,
}

// Box3.setFromObject(scene) measures in world space, which is contaminated
// by outerRef's large fixed base rotation (~-126° yaw) once `scene` is
// mounted under it. This is fine for the vault (its offsets were tuned by eye
// against that same measurement), but it throws off any other model's true
// center, especially once that model gets its own rotation applied on top.
// This measures purely relative to `root` itself, ignoring every ancestor.
export function getLocalBoundingBox(root: THREE.Object3D): THREE.Box3 {
  root.updateWorldMatrix(true, true)
  const rootWorldInverse = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const box = new THREE.Box3()
  const meshBox = new THREE.Box3()
  const relativeMatrix = new THREE.Matrix4()

  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return

    meshBox.copy(mesh.geometry.boundingBox)
    relativeMatrix.multiplyMatrices(rootWorldInverse, mesh.matrixWorld)
    meshBox.applyMatrix4(relativeMatrix)
    box.union(meshBox)
  })

  return box
}

type VaultRig = {
  door: THREE.Object3D | null
  doorClosedRotationY: number
  handleTarget: DoorItemSpinTarget | null
  numbersTarget: DoorItemSpinTarget | null
}

export default function VaultSceneModel({
  modelUrl,
  focused,
  scale = 1,
  label,
}: {
  modelUrl: string
  focused: boolean
  scale?: number
  /** This project's title, becomes this instance's own Leva folder, so
   * every model gets independent sliders instead of sharing one "vault" or
   * "other models" bucket with every other project of the same kind. */
  label: string
}) {
  const { scene } = useGLTF(modelUrl)
  const { clock } = useThree()
  const debugStore = useDebugStore()

  // Known synchronously: useGLTF suspends until `scene` is loaded, so by the
  // time this line runs the mesh is already there to inspect. Only used to
  // pick which preset seeds this instance's sliders: the vault keeps its
  // door/handle/dial rig regardless.
  const isVault = useMemo(() => Boolean(scene.getObjectByName('VaultDoor')), [scene])
  const defaults = isVault ? VAULT_MODEL_TUNING : DEFAULT_MODEL_TUNING

  const tuning = useControls(
    label,
    {
      targetSize: { value: defaults.targetSize, min: 0.1, max: 3, step: 0.01 },
      verticalOffset: { value: defaults.verticalOffset, min: -2, max: 2, step: 0.01 },
      rotationX: { value: defaults.rotationX, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: defaults.rotationY, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: defaults.rotationZ, min: -Math.PI, max: Math.PI, step: 0.01 },
      ambientSway: defaults.ambientSway,
      outerRotationX: { value: defaults.outerRotationX, min: -1, max: 1, step: 0.01 },
      outerPositionY: { value: defaults.outerPositionY, min: -2, max: 2, step: 0.01 },
    },
    { store: debugStore ?? undefined },
  ) as ModelTuning

  const outerRef = useRef<THREE.Group>(null)
  const modelWrapRef = useRef<THREE.Group>(null)

  const rigRef = useRef<VaultRig>({
    door: null,
    doorClosedRotationY: 0,
    handleTarget: null,
    numbersTarget: null,
  })
  const cardStatesRef = useRef<MemoryCardState[]>(createMemoryCardStates())
  const cardMeshRefs = useRef<(THREE.Mesh | null)[]>([])
  const cardMaterialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([])

  const sequenceStartRef = useRef<number | null>(null)
  const closingStartRef = useRef<number | null>(null)
  const closingCardPlansRef = useRef<ClosingCardPlan[]>([])
  const closeCompleteTimeRef = useRef(0)

  const pointerTiltRef = useRef({ x: 0, y: 0 })
  const currentTiltRef = useRef({ x: 0, y: 0 })
  // True once the vault has fully finished closing (or hasn't opened yet).
  // Skips the door/handle/dial/card math entirely so an always-mounted,
  // usually-idle vault doesn't do per-frame work forever.
  const isIdleRef = useRef(true)

  const memoryTextures = useMemo(() => heroMemoryCards.map(createMemoryTexture), [])

  useEffect(() => {
    let door: THREE.Object3D | null = null
    let handleMesh: THREE.Object3D | null = null
    let numbersMesh: THREE.Object3D | null = null

    scene.traverse((child) => {
      if (child.name === 'VaultDoor') door = child
      if (child.name === 'VaultHandle') handleMesh = child
      if (child.name === 'VaultNumbers') numbersMesh = child
    })

    const hasDoor = Boolean(door)
    // The vault's measurement stays exactly as before (its offsets were
    // tuned against it); other models use the ancestor-independent version
    // so their centering is correct regardless of outerRef's base rotation.
    const box = hasDoor ? new THREE.Box3().setFromObject(scene) : getLocalBoundingBox(scene)
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
      modelWrapRef.current.position.set(
        -scaledCenter.x,
        -scaledCenter.y + tuning.verticalOffset,
        -scaledCenter.z,
      )
    }

    // Idempotency guard: this effect can run twice on the same cached scene
    // (see createDoorItemSpinTarget's comment): by the second run the door
    // may already have an in-progress rotation applied by useFrame, so only
    // ever capture the true closed rest angle once.
    let doorClosedRotationY = 0
    if (door) {
      const doorObject = door as THREE.Object3D
      if (doorObject.userData.closedRotationY === undefined) {
        doorObject.userData.closedRotationY = doorObject.rotation.y
      }
      doorClosedRotationY = doorObject.userData.closedRotationY as number
    }

    rigRef.current = {
      door,
      doorClosedRotationY,
      handleTarget: handleMesh ? createDoorItemSpinTarget(handleMesh) : null,
      numbersTarget: numbersMesh ? createDoorItemSpinTarget(numbersMesh) : null,
    }
  }, [
    scene,
    tuning.targetSize,
    tuning.verticalOffset,
    tuning.rotationX,
    tuning.rotationY,
    tuning.rotationZ,
  ])

  const triggerClose = (elapsed: number) => {
    if (sequenceStartRef.current === null) return

    const sequenceTime = Math.max(0, elapsed - sequenceStartRef.current)
    const globalOrbitSpin =
      Math.max(0, sequenceTime - memoryGlobalOrbitStartTime) * memorySettledOrbitSpeed

    const cardCloseDistances = cardStatesRef.current.map((card, index) => {
      const startAngle = getOpenCardOrbitAngle(card, sequenceTime, globalOrbitSpin)
      const frontDistance = getForwardAngleDistance(startAngle, card.startAngle)
      return { index, startAngle, frontDistance }
    })

    closingCardPlansRef.current = cardCloseDistances.map((card, index) => ({
      startAngle: card.startAngle,
      frontDelay: getAcceleratedClosingOrbitDuration(card.frontDistance),
      flyInDuration: cardStatesRef.current[index].popDuration,
    }))
    closeCompleteTimeRef.current = finiteOrFallback(
      Math.max(
        0,
        ...closingCardPlansRef.current.map((plan) => plan.frontDelay + plan.flyInDuration),
      ),
      memoryPopDuration,
    )
    closingStartRef.current = elapsed
  }

  useEffect(() => {
    const elapsed = clock.elapsedTime

    if (focused) {
      isIdleRef.current = false
      sequenceStartRef.current = elapsed
      closingStartRef.current = null
      closingCardPlansRef.current = []
      closeCompleteTimeRef.current = 0
    } else if (sequenceStartRef.current !== null) {
      // Only the else-branch of a real "was open, now closing" transition
      // needs to run: a vault that was never opened has nothing to close.
      isIdleRef.current = false
      triggerClose(elapsed)
    }
    // triggerClose is stable across renders (recreated each render but only
    // reads/writes refs), safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, clock])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.3) * 2
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.3) * 2
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

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime

    // The idle sway is a per-model flourish (vault: on) that runs all the
    // time, independent of focus. Mouse-follow tilt is a separate lever
    // that only kicks in once a card is the active/open one, for any model.
    if (outerRef.current) {
      const tilt = currentTiltRef.current
      const target = pointerTiltRef.current
      tilt.x += (target.x - tilt.x) * 0.08
      tilt.y += (target.y - tilt.y) * 0.08

      const sway = tuning.ambientSway ? Math.sin(elapsed * 0.35) * 0.05 : 0
      const bob = tuning.ambientSway ? Math.sin(elapsed * 0.5) * 0.018 : 0
      const bobY = tuning.ambientSway ? Math.sin(elapsed * 0.8) * 0.035 : 0
      const tiltY = focused ? tilt.y * 0.16 : 0
      const tiltX = focused ? tilt.x * 0.1 : 0

      outerRef.current.rotation.y = vaultBaseRotationY + sway + tiltY
      outerRef.current.rotation.x = tuning.outerRotationX + bob + tiltX
      outerRef.current.position.y = tuning.outerPositionY + bobY
    }

    const rig = rigRef.current
    if (!rig.door || isIdleRef.current) return

    const sequenceStart = sequenceStartRef.current
    const closingStart = closingStartRef.current
    const sequenceTime = sequenceStart === null ? 0 : Math.max(0, elapsed - sequenceStart)
    const closingElapsed = closingStart === null ? null : Math.max(0, elapsed - closingStart)
    const safeCloseCompleteTime = finiteOrFallback(closeCompleteTimeRef.current, memoryPopDuration)
    let openAmount = 0

    if (closingElapsed !== null) {
      openAmount =
        1 -
        smoothstep(
          (closingElapsed - safeCloseCompleteTime - memoryCloseDoorDelay) / memoryCloseDoorDuration,
        )
    } else if (
      sequenceTime >= vaultDoorOpenStartTime &&
      sequenceTime < vaultDoorOpenStartTime + vaultDoorOpenDuration
    ) {
      openAmount = smoothstep((sequenceTime - vaultDoorOpenStartTime) / vaultDoorOpenDuration)
    } else if (sequenceTime >= vaultDoorOpenStartTime + vaultDoorOpenDuration) {
      openAmount = 1
    }

    const safeOpenAmount = finiteOrFallback(openAmount, 1)
    rig.door.rotation.y = rig.doorClosedRotationY + vaultDoorOpenRotationY * safeOpenAmount

    if (rig.handleTarget || rig.numbersTarget) {
      let handleSpinAmount = getSpinAmount(
        sequenceTime,
        vaultHandleUnlockSpinStartTime,
        vaultHandleUnlockSpinDuration,
        vaultHandleSpinRadians,
      )
      let numbersSpinAmount = getCombinationDialSpinAmount(sequenceTime)

      if (closingElapsed !== null) {
        const relockSpinStartTime =
          safeCloseCompleteTime +
          memoryCloseDoorDelay +
          memoryCloseDoorDuration +
          vaultRelockSpinDelay
        handleSpinAmount = getSpinAmount(
          closingElapsed,
          relockSpinStartTime,
          vaultRelockSpinDuration,
          vaultHandleSpinRadians,
        )
        numbersSpinAmount = vaultNumbersCombinationFinalRadians
      }

      if (rig.handleTarget) applyDoorItemMeshSpin(rig.handleTarget, handleSpinAmount)
      if (rig.numbersTarget) applyDoorItemMeshSpin(rig.numbersTarget, numbersSpinAmount)
    }

    const globalOrbitSpin =
      Math.max(0, sequenceTime - memoryGlobalOrbitStartTime) * memorySettledOrbitSpeed

    cardStatesRef.current.forEach((card, index) => {
      const mesh = cardMeshRefs.current[index]
      const material = cardMaterialRefs.current[index]
      if (!mesh || !material) return

      const cardTime = sequenceTime - memoryPopStartTime - card.popDelay
      const movingStartAngle = card.startAngle + globalOrbitSpin
      const orbitStartPoint = getOrbitPoint(movingStartAngle, card.radius, card.yOffset)
      const closingPlan = closingCardPlansRef.current[index]

      let x = memoryVaultFrontExitPoint.x
      let y = memoryVaultFrontExitPoint.y
      let z = memoryVaultFrontExitPoint.z
      let orbitAngle = movingStartAngle
      let opacity = 0

      if (closingElapsed !== null && closingPlan) {
        const flyInTime = closingElapsed - closingPlan.frontDelay

        if (flyInTime < 0) {
          orbitAngle = closingPlan.startAngle + getAcceleratedClosingOrbitDistance(closingElapsed)
          const orbitPoint = getOrbitPoint(orbitAngle, card.radius, card.yOffset)
          x = orbitPoint.x
          y = orbitPoint.y
          z = orbitPoint.z
          opacity = 1
        } else if (flyInTime < closingPlan.flyInDuration) {
          orbitAngle =
            closingPlan.startAngle +
            getAcceleratedClosingOrbitDistance(
              closingPlan.frontDelay + flyInTime * memoryClosingFlyInOrbitCarry,
            )
          const flyInProgress = smoothstep(flyInTime / closingPlan.flyInDuration)
          const orbitPoint = getOrbitPoint(orbitAngle, card.radius, card.yOffset)

          x = orbitPoint.x + (memoryVaultFrontExitPoint.x - orbitPoint.x) * flyInProgress
          y = orbitPoint.y + (memoryVaultFrontExitPoint.y - orbitPoint.y) * flyInProgress
          z = orbitPoint.z + (memoryVaultFrontExitPoint.z - orbitPoint.z) * flyInProgress
          opacity = 1 - flyInProgress
        }
      } else if (cardTime >= 0 && cardTime < card.popDuration) {
        const popProgress = easeOutBack(cardTime / card.popDuration)
        x =
          memoryVaultFrontExitPoint.x +
          (orbitStartPoint.x - memoryVaultFrontExitPoint.x) * popProgress
        y =
          memoryVaultFrontExitPoint.y +
          (orbitStartPoint.y - memoryVaultFrontExitPoint.y) * popProgress
        z =
          memoryVaultFrontExitPoint.z +
          (orbitStartPoint.z - memoryVaultFrontExitPoint.z) * popProgress
        opacity = smoothstep(cardTime / 0.16)
      } else if (cardTime >= card.popDuration) {
        const orbitTravelTime = cardTime - card.popDuration
        const orbitTravelProgress = smoothstep(orbitTravelTime / card.orbitDuration)

        orbitAngle = movingStartAngle + (card.targetAngle - card.startAngle) * orbitTravelProgress

        const orbitPoint = getOrbitPoint(orbitAngle, card.radius, card.yOffset)
        x = orbitPoint.x
        y = orbitPoint.y
        z = orbitPoint.z
        opacity = 1
      }

      mesh.visible = opacity > 0.01
      material.opacity = opacity
      mesh.position.set(x, y, z)
      mesh.rotation.set(
        Math.sin(elapsed * 1.3 + index) * 0.22,
        -vaultBaseRotationY + Math.sin(orbitAngle) * memoryFacingYawAmount,
        Math.sin(elapsed * 1.7 + index * 0.8) * 0.28,
      )
    })

    if (closingElapsed !== null) {
      const totalCloseDuration =
        safeCloseCompleteTime +
        memoryCloseDoorDelay +
        memoryCloseDoorDuration +
        vaultRelockSpinDelay +
        vaultRelockSpinDuration
      if (closingElapsed > totalCloseDuration + 0.15) {
        isIdleRef.current = true
      }
    }
  })

  return (
    <group scale={scale}>
      <group ref={outerRef} rotation={[0.03, vaultBaseRotationY, 0]} position={[0, -0.08, 0]}>
        <group ref={modelWrapRef}>
          <primitive object={scene} />
        </group>
        {heroMemoryCards.map((_, index) => (
          <mesh
            key={index}
            ref={(el) => {
              cardMeshRefs.current[index] = el
            }}
            visible={false}
          >
            <planeGeometry args={[0.4, 0.6]} />
            <meshBasicMaterial
              ref={(el) => {
                cardMaterialRefs.current[index] = el
              }}
              map={memoryTextures[index]}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
