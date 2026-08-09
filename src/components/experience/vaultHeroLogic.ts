import * as THREE from 'three'
import { drawHeroEnvelope, drawSquirclePath } from '@/lib/heroEnvelope'

// Pure, framework-agnostic vault animation logic — extracted verbatim from
// the original VaultHeroModel so it can run inside the row's shared R3F
// canvas via useFrame instead of a second, standalone WebGLRenderer.

export type MemoryCardState = {
  startAngle: number
  targetAngle: number
  popDelay: number
  popDuration: number
  orbitDuration: number
  radius: number
  yOffset: number
}

export type ClosingCardPlan = {
  startAngle: number
  frontDelay: number
  flyInDuration: number
}

export type DoorItemSpinTarget = {
  pivot: THREE.Object3D
  axis: THREE.Vector3
  baseQuaternion: THREE.Quaternion
}

export type HeroMemoryCard =
  | { kind: 'image'; src?: string }
  | { kind: 'note'; title: string; lines: string[] }
  | { kind: 'folder' }
  | { kind: 'envelope' }

export const heroMemoryCards = [
  {
    kind: 'note',
    title: 'Selected Work',
    lines: ['A few objects,', 'images and ideas', 'worth a second look.'],
  },
  { kind: 'image' },
  { kind: 'folder' },
  { kind: 'envelope' },
  {
    kind: 'note',
    title: 'Say hello',
    lines: ['Always open to', 'new work and', 'good conversation.'],
  },
  { kind: 'image' },
] as const satisfies readonly HeroMemoryCard[]

export const vaultBaseRotationY = -Math.PI / 1.55 - 0.18
export const vaultDoorOpenRotationY = 1.7
const fullOrbitRadians = Math.PI * 2
const memoryOrbitWidth = 1.3
const memoryOrbitDepth = 0.7
const memoryFrontLift = 0
export const memoryFacingYawAmount = 0.22
export const memoryOrbitGuideRadius = 1.6
export const memoryOrbitStartAngle = Math.PI + 0.14
export const memoryPopStartTime = 3.3
export const memoryPopDelay = 0.18
export const memoryPopDuration = 0.42
export const memoryOrbitArrivalTime = 6.25
// The vault model's own bounding-box centre (used to place it at the local
// origin) sits well below its door — the box includes the base/feet, which
// pulls the geometric centre down — so cards popping out of "the origin"
// read as emerging from below the vault entirely. Lifting the shared exit
// point (and the orbit's own vertical baseline, below) compensates without
// having to fight the model's own centring.
const MEMORY_VERTICAL_BASELINE = 0.17
export const memoryVaultFrontExitPoint = { x: 0, y: MEMORY_VERTICAL_BASELINE, z: 0 }
export const memoryGlobalOrbitStartTime = 5.05
// Orbit speed (The lower the last number, the slower)
export const memorySettledOrbitSpeed = Math.PI * 2 * 0.1
const memoryClosingOrbitSpeed = memorySettledOrbitSpeed * 3
const memoryClosingOrbitAcceleration = memoryClosingOrbitSpeed * 0.9
export const memoryClosingFlyInOrbitCarry = 0.38
export const memoryCloseDoorDelay = 0.34
export const memoryCloseDoorDuration = 0.78
export const vaultNumbersSpinStartTime = 0.12
export const vaultNumbersSpinStepDuration = 0.48
export const vaultNumbersSpinStepPause = 0.08
export const vaultHandleUnlockSpinStartTime =
  vaultNumbersSpinStartTime +
  vaultNumbersSpinStepDuration * 3 +
  vaultNumbersSpinStepPause * 2 +
  0.16
export const vaultHandleUnlockSpinDuration = 0.58
export const vaultDoorOpenStartTime =
  vaultHandleUnlockSpinStartTime + vaultHandleUnlockSpinDuration + 0.16
export const vaultDoorOpenDuration = 0.86
export const vaultRelockSpinDelay = 0.12
export const vaultRelockSpinDuration = 0.72
export const vaultHandleSpinRadians = Math.PI * 2
const vaultNumbersFirstTurnRadians = Math.PI * 2 * 0.5
const vaultNumbersBackTurnRadians = -Math.PI * 2 * 0.66
const vaultNumbersFinalTurnRadians = Math.PI * 2 * 0.45
export const vaultNumbersCombinationFinalRadians =
  vaultNumbersFirstTurnRadians + vaultNumbersBackTurnRadians + vaultNumbersFinalTurnRadians
const vaultDoorItemSpinAxis = new THREE.Vector3(1, 0, -1).normalize()

function counterRotateOrbitPoint(x: number, z: number) {
  const angle = -vaultBaseRotationY
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    x: x * cos - z * sin,
    z: x * sin + z * cos,
  }
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function smoothstep(value: number) {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export function getSpinAmount(time: number, startTime: number, duration: number, radians: number) {
  return smoothstep((time - startTime) / duration) * radians
}

export function getCombinationDialSpinAmount(time: number) {
  const firstStart = vaultNumbersSpinStartTime
  const secondStart = firstStart + vaultNumbersSpinStepDuration + vaultNumbersSpinStepPause
  const thirdStart = secondStart + vaultNumbersSpinStepDuration + vaultNumbersSpinStepPause

  const firstAmount = getSpinAmount(
    time,
    firstStart,
    vaultNumbersSpinStepDuration,
    vaultNumbersFirstTurnRadians,
  )
  const secondAmount = getSpinAmount(
    time,
    secondStart,
    vaultNumbersSpinStepDuration,
    vaultNumbersBackTurnRadians,
  )
  const thirdAmount = getSpinAmount(
    time,
    thirdStart,
    vaultNumbersSpinStepDuration,
    vaultNumbersFinalTurnRadians,
  )

  return firstAmount + secondAmount + thirdAmount
}

export function finiteOrFallback(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

export function getForwardAngleDistance(fromAngle: number, toAngle: number) {
  return (((toAngle - fromAngle) % fullOrbitRadians) + fullOrbitRadians) % fullOrbitRadians
}

export function getAcceleratedClosingOrbitDistance(time: number) {
  const t = Math.max(0, time)
  return memoryClosingOrbitSpeed * t + 0.5 * memoryClosingOrbitAcceleration * t * t
}

export function getAcceleratedClosingOrbitDuration(distance: number) {
  if (memoryClosingOrbitAcceleration <= 0) {
    return distance / memoryClosingOrbitSpeed
  }

  return (
    (-memoryClosingOrbitSpeed +
      Math.sqrt(
        memoryClosingOrbitSpeed * memoryClosingOrbitSpeed +
          2 * memoryClosingOrbitAcceleration * distance,
      )) /
    memoryClosingOrbitAcceleration
  )
}

export function easeOutBack(value: number) {
  const t = clamp01(value)
  const c1 = 1.7
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function getOrbitPoint(angle: number, radius: number, yOffset: number) {
  const frontAmount = smoothstep(Math.cos(angle))
  const orbitX = Math.cos(angle) * radius * memoryOrbitWidth
  const orbitZ = Math.sin(angle) * radius * memoryOrbitDepth
  const rotatedOrbitPoint = counterRotateOrbitPoint(orbitX, orbitZ)

  return {
    x: rotatedOrbitPoint.x,
    y: yOffset + Math.sin(angle * 1.7) * 0.18 + frontAmount * memoryFrontLift,
    z: rotatedOrbitPoint.z,
  }
}

export function getOpenCardOrbitAngle(
  card: MemoryCardState,
  sequenceTime: number,
  globalOrbitSpin: number,
) {
  const cardTime = sequenceTime - memoryPopStartTime - card.popDelay
  const movingStartAngle = card.startAngle + globalOrbitSpin

  if (cardTime < card.popDuration) {
    return movingStartAngle
  }

  const orbitTravelTime = cardTime - card.popDuration
  const orbitTravelProgress = smoothstep(orbitTravelTime / card.orbitDuration)

  return movingStartAngle + (card.targetAngle - card.startAngle) * orbitTravelProgress
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight
  let sourceX = 0
  let sourceY = 0

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio
    sourceX = (image.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = image.naturalWidth / targetRatio
    sourceY = (image.naturalHeight - sourceHeight) / 2
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

function drawMemoryTextureCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  card: HeroMemoryCard,
  index: number,
  loadedImage?: HTMLImageElement,
) {
  context.clearRect(0, 0, canvas.width, canvas.height)

  if (card.kind === 'folder') {
    const folderTop = 42
    const folderLeft = 12
    const folderWidth = 224
    const folderHeight = 176

    context.save()
    context.shadowColor = 'rgba(80, 66, 110, 0.26)'
    context.shadowBlur = 14
    context.shadowOffsetX = 0
    context.shadowOffsetY = 12

    context.fillStyle = '#b7a9e0'
    context.beginPath()
    context.moveTo(folderLeft, folderTop + 34)
    context.lineTo(folderLeft + 72, folderTop + 34)
    context.quadraticCurveTo(folderLeft + 82, folderTop + 34, folderLeft + 90, folderTop + 44)
    context.lineTo(folderLeft + 108, folderTop + 66)
    context.lineTo(folderLeft + folderWidth - 12, folderTop + 66)
    context.quadraticCurveTo(
      folderLeft + folderWidth - 4,
      folderTop + 66,
      folderLeft + folderWidth - 4,
      folderTop + 74,
    )
    context.lineTo(folderLeft + folderWidth - 4, folderTop + folderHeight)
    context.quadraticCurveTo(
      folderLeft + folderWidth - 4,
      folderTop + folderHeight + 8,
      folderLeft + folderWidth - 12,
      folderTop + folderHeight + 8,
    )
    context.lineTo(folderLeft + 8, folderTop + folderHeight + 8)
    context.quadraticCurveTo(
      folderLeft,
      folderTop + folderHeight + 8,
      folderLeft,
      folderTop + folderHeight,
    )
    context.closePath()
    context.fill()

    context.shadowColor = 'transparent'
    const folderGradient = context.createLinearGradient(
      folderLeft,
      folderTop + 64,
      folderLeft + folderWidth,
      folderTop + folderHeight + 8,
    )
    folderGradient.addColorStop(0, '#e4dbf5')
    folderGradient.addColorStop(1, '#8f7cc7')
    context.fillStyle = folderGradient
    context.beginPath()
    context.moveTo(folderLeft - 2, folderTop + 78)
    context.lineTo(folderLeft + folderWidth + 12, folderTop + 78)
    context.lineTo(folderLeft + folderWidth + 2, folderTop + folderHeight + 26)
    context.quadraticCurveTo(
      folderLeft + folderWidth,
      folderTop + folderHeight + 34,
      folderLeft + folderWidth - 10,
      folderTop + folderHeight + 34,
    )
    context.lineTo(folderLeft + 12, folderTop + folderHeight + 34)
    context.quadraticCurveTo(
      folderLeft + 2,
      folderTop + folderHeight + 34,
      folderLeft,
      folderTop + folderHeight + 24,
    )
    context.closePath()
    context.fill()

    context.restore()
    return
  }

  if (card.kind === 'envelope') {
    drawHeroEnvelope(context)
    return
  }

  context.save()
  drawSquirclePath(context, 8, 8, canvas.width - 16, canvas.height - 16, 44)
  context.clip()

  context.fillStyle = card.kind === 'note' ? '#fbfbfa' : '#f4f1ec'
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (card.kind === 'image') {
    if (loadedImage) {
      drawCoverImage(context, loadedImage, 0, 0, canvas.width, canvas.height)
    } else {
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, index % 2 === 0 ? '#f4f1ec' : '#17151c')
      gradient.addColorStop(1, index % 2 === 0 ? '#d8cfe8' : '#3a3247')
      context.fillStyle = gradient
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  if (card.kind === 'note') {
    context.fillStyle = '#2f3437'
    context.font = '700 26px sans-serif'
    context.fillText(card.title, 30, 62)
    context.font = '600 20px sans-serif'
    context.strokeStyle = 'rgba(183, 169, 224, 0.55)'
    context.lineWidth = 4
    for (let line = 0; line < 5; line += 1) {
      const y = 104 + line * 36
      context.beginPath()
      context.moveTo(30, y)
      context.lineTo(226 - (line % 2) * 36, y)
      context.stroke()
    }

    context.fillStyle = '#2f3437'
    card.lines.slice(0, 5).forEach((line, lineIndex) => {
      context.fillText(line, 30, 126 + lineIndex * 36)
    })
  }

  context.restore()
}

export function createMemoryTexture(card: HeroMemoryCard, index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320

  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.CanvasTexture(canvas)
  }

  const texture = new THREE.CanvasTexture(canvas)
  // These canvases are 256x320 — not power-of-two — so mipmapping is a
  // needless compatibility risk on some GPUs/drivers for what's flat 2D
  // content anyway.
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  drawMemoryTextureCanvas(context, canvas, card, index)

  if (card.kind === 'image' && card.src) {
    const image = new Image()
    image.onload = () => {
      drawMemoryTextureCanvas(context, canvas, card, index, image)
      texture.needsUpdate = true
    }
    image.src = card.src
  }

  return texture
}

export function createMemoryCardStates(): MemoryCardState[] {
  const cardCount = heroMemoryCards.length

  return Array.from({ length: cardCount }, (_, index): MemoryCardState => {
    const targetAngle = memoryOrbitStartAngle + ((cardCount - index) / cardCount) * Math.PI * 2
    const popDelay = index * memoryPopDelay
    const popDuration = memoryPopDuration
    const orbitDuration = Math.max(
      0.8,
      memoryOrbitArrivalTime - memoryPopStartTime - popDelay - popDuration,
    )

    return {
      startAngle: memoryOrbitStartAngle,
      targetAngle,
      popDelay,
      popDuration,
      orbitDuration,
      radius: memoryOrbitGuideRadius,
      yOffset: MEMORY_VERTICAL_BASELINE - 0.08 + (index % 4) * 0.12,
    }
  })
}

/**
 * Re-homes a mesh under a pivot Group positioned at the mesh's own
 * bounding-box centre, so it can be spun in place with a plain GPU transform
 * instead of rewriting every vertex position (and recomputing normals from
 * scratch) on the CPU every single frame — that per-frame vertex rewrite is
 * expensive enough, running indefinitely for the vault's whole lifetime, to
 * risk GPU driver instability on real hardware.
 */
export function createDoorItemSpinTarget(mesh: THREE.Object3D): DoorItemSpinTarget | null {
  if (!(mesh instanceof THREE.Mesh) || !(mesh.geometry instanceof THREE.BufferGeometry)) {
    return null
  }

  // Idempotency guard: the GLTF scene this mesh lives in is cached and
  // shared (never re-created), but the effect that calls this can run more
  // than once on the same scene (Suspense-loaded components get a real
  // double-invoke in dev, not just React's synthetic double-effect). A
  // second call would re-parent an already-centred mesh into a *second*
  // pivot, doubling the offset and visibly displacing the part — so once a
  // mesh has a pivot, just hand back the existing one.
  const existingPivot = mesh.userData.doorItemPivot as THREE.Object3D | undefined
  if (existingPivot) {
    return {
      pivot: existingPivot,
      axis: vaultDoorItemSpinAxis.clone(),
      baseQuaternion: (mesh.userData.doorItemBaseQuaternion as THREE.Quaternion).clone(),
    }
  }

  const parent = mesh.parent
  if (!parent) return null

  mesh.geometry.computeBoundingBox()
  const box = mesh.geometry.boundingBox
  if (!box || box.isEmpty()) return null
  const center = box.getCenter(new THREE.Vector3())

  const baseQuaternion = mesh.quaternion.clone()
  // The pivot must land at the mesh's true geometric centre *in the parent's
  // space*, not at the mesh's own local origin — those only coincide if the
  // origin already sits at the bounding-box centre. Skipping this transform
  // is what made the handle and dial jump on top of each other instead of
  // staying at their modelled spots on the door.
  const centerOffset = center.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion)

  const pivot = new THREE.Group()
  pivot.position.copy(mesh.position).add(centerOffset)
  pivot.quaternion.copy(baseQuaternion)
  pivot.scale.copy(mesh.scale)

  parent.add(pivot)
  pivot.add(mesh)

  mesh.position.set(-center.x, -center.y, -center.z)
  mesh.quaternion.identity()
  mesh.scale.set(1, 1, 1)
  mesh.userData.doorItemPivot = pivot
  mesh.userData.doorItemBaseQuaternion = baseQuaternion

  return { pivot, axis: vaultDoorItemSpinAxis.clone(), baseQuaternion }
}

const scratchSpinQuaternion = new THREE.Quaternion()

/**
 * Spins the pivot around its fixed axis while preserving the item's
 * originally modelled orientation on the door — the spin quaternion is
 * composed on top of the base orientation, not written over it, so the
 * handle/dial keep the tilt they had in the glb instead of snapping flat
 * the moment the vault starts animating.
 */
export function applyDoorItemMeshSpin(target: DoorItemSpinTarget, amount: number) {
  scratchSpinQuaternion.setFromAxisAngle(target.axis, amount)
  target.pivot.quaternion.multiplyQuaternions(scratchSpinQuaternion, target.baseQuaternion)
}
