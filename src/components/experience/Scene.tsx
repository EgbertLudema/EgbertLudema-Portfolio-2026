'use client'

import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import CardItem from './CardItem'
import { useDebugStore } from './debugStore'
import type { ExperienceItem } from './items'

export const SPACING = 1.3
// How many drag pixels equal one card's worth of travel, for the live
// follow effect below — tuned against the on-screen card spacing at
// typical phone widths, not derived from the camera's actual projection
// (that would need per-frame screen->world unprojection for a value that's
// only ever used as a feel constant).
export const DRAG_PIXELS_PER_CARD = 140

function Row({
  items,
  activeIndex,
  onSelect,
  dragForwardPx,
  isDragging,
  releaseTick,
}: {
  items: ExperienceItem[]
  activeIndex: number
  onSelect: (index: number) => void
  dragForwardPx: React.RefObject<number>
  isDragging: React.RefObject<boolean>
  releaseTick: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    gsap.to(groupRef.current.position, {
      x: -activeIndex * SPACING,
      duration: 1,
      ease: 'power3.out',
    })
    // releaseTick isn't read here, but bumping it (on every drag release,
    // even one that snaps back to the same card) needs to re-trigger this
    // settle tween — a drag that doesn't cross the snap threshold still
    // leaves the row sitting at a live-follow offset that has to ease back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, releaseTick])

  useFrame(() => {
    if (!groupRef.current || !isDragging.current) return
    // Live-follows the pointer/touch while dragging, bypassing the GSAP
    // settle tween entirely so the row feels attached to the finger; once
    // released, the effect above takes over from wherever this left off.
    gsap.killTweensOf(groupRef.current.position)
    const dragWorldUnits = (dragForwardPx.current / DRAG_PIXELS_PER_CARD) * SPACING
    groupRef.current.position.x = -activeIndex * SPACING - dragWorldUnits
  })

  return (
    <group ref={groupRef}>
      {items.map((item, index) => (
        <group key={item.id} position={[index * SPACING, 0, 0]}>
          <CardItem
            item={item}
            focused={index === activeIndex}
            onSelect={() => onSelect(index)}
            dragOffsetFromCenter={index - activeIndex}
            dragForwardPx={dragForwardPx}
            isDragging={isDragging}
            releaseTick={releaseTick}
            spacing={SPACING}
            dragPixelsPerCard={DRAG_PIXELS_PER_CARD}
          />
        </group>
      ))}
    </group>
  )
}

/** Ticks a shared ref every rendered frame so the context-lost handler can
 * report exactly how far we got before the crash. */
function FrameCounter({ countRef }: { countRef: React.RefObject<number> }) {
  useFrame(() => {
    countRef.current += 1
  })
  return null
}

type CameraTuning = {
  positionX: number
  positionY: number
  positionZ: number
  fov: number
  lookAtX: number
  lookAtY: number
  lookAtZ: number
}

// The Leva-tuned camera position/fov is dialed in against a landscape
// desktop window. A fixed vertical FOV on a narrower (portrait phone or
// tablet) canvas shrinks the horizontal frustum proportionally, cropping
// the card row that's spaced out along X (see SPACING). Rather than widen
// the FOV (which introduces fisheye distortion up close), dolly the camera
// straight back along its line to the look-at point as the aspect ratio
// narrows below the reference — same framing angle, just further away, so
// the full row comes back into view without warping it.
const REFERENCE_ASPECT = 1.6
const MAX_DOLLY = 2.2

// Below this aspect ratio the layout switches to the mobile drawer (no
// side list, no bottom bar competing for frame space, see the 720px CSS
// breakpoint). Mobile forces lookAt.x to 0 regardless of the Leva-tunable
// camera.lookAtX default above (also 0), so a debug session nudging that
// slider for desktop framing can't accidentally decentre the mobile view.
const MOBILE_ASPECT_THRESHOLD = 0.8
const MOBILE_DOLLY = 1.05
// Aiming slightly below the card's actual height pushes its projected
// position up the screen, toward the empty middle of the mobile layout
// (title/button block now sits low, near the bottom edge) instead of the
// card centring on the camera's desktop-tuned eye-line.
const MOBILE_LOOKAT_Y_OFFSET = -0.35

function ResponsiveCamera({ camera }: { camera: CameraTuning }) {
  const { size } = useThree()
  const aspect = size.width / size.height
  const isMobile = aspect < MOBILE_ASPECT_THRESHOLD
  const dolly = isMobile
    ? MOBILE_DOLLY
    : aspect < REFERENCE_ASPECT
      ? Math.min(REFERENCE_ASPECT / aspect, MAX_DOLLY)
      : 1

  const lookAt = new THREE.Vector3(
    isMobile ? 0 : camera.lookAtX,
    isMobile ? camera.lookAtY + MOBILE_LOOKAT_Y_OFFSET : camera.lookAtY,
    camera.lookAtZ,
  )
  const position = new THREE.Vector3(camera.positionX, camera.positionY, camera.positionZ)
    .sub(lookAt)
    .multiplyScalar(dolly)
    .add(lookAt)

  return (
    <PerspectiveCamera
      makeDefault
      fov={camera.fov}
      position={position.toArray()}
      onUpdate={(cam) => cam.lookAt(lookAt)}
    />
  )
}

export default function Scene({
  items,
  activeIndex,
  onSelect,
  onContextLost,
  dragForwardPx,
  isDragging,
  releaseTick,
}: {
  items: ExperienceItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onContextLost?: () => void
  dragForwardPx: React.RefObject<number>
  isDragging: React.RefObject<boolean>
  releaseTick: number
}) {
  const frameCountRef = useRef(0)
  const startTimeRef = useRef(0)
  const debugStore = useDebugStore()

  const camera = useControls(
    'Camera',
    {
      positionX: { value: -2.6, min: -10, max: 10, step: 0.1 },
      positionY: { value: 1.1, min: -10, max: 10, step: 0.1 },
      positionZ: { value: 6.4, min: -10, max: 20, step: 0.1 },
      fov: { value: 40, min: 10, max: 100, step: 1 },
      lookAtX: { value: 0, min: -10, max: 10, step: 0.1 },
      lookAtY: { value: 0, min: -10, max: 10, step: 0.1 },
      lookAtZ: { value: 0, min: -10, max: 10, step: 0.1 },
    },
    { store: debugStore ?? undefined },
  )

  return (
    <Canvas
      // Fixed at 1 previously, ignoring real device pixel density. Phones
      // commonly report 2-3x, and the mobile camera also dollies in closer
      // (MOBILE_DOLLY above) than desktop, so the same flat under-resolution
      // read as pixelation there far more than on a typical 1x desktop
      // monitor. Capped at 2 (rather than uncapped) to avoid tanking frame
      // rate on very high-density phones — this app already has WebGL
      // context-loss recovery wired up (see onCreated below), a sign GPU
      // headroom here has been tight before.
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'default' }}
      onCreated={({ scene, gl }) => {
        scene.background = null
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        gl.outputColorSpace = THREE.SRGBColorSpace
        startTimeRef.current = performance.now()

        const debugInfo = gl.getContext().getExtension('WEBGL_debug_renderer_info')
        const renderer = debugInfo
          ? gl.getContext().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : 'unavailable (WEBGL_debug_renderer_info not exposed)'
        const vendor = debugInfo
          ? gl.getContext().getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
          : 'unavailable'
        // eslint-disable-next-line no-console
        console.info('[Scene] WebGL renderer:', renderer, '| vendor:', vendor)

        gl.domElement.addEventListener('webglcontextlost', (event) => {
          // Signals the browser we intend to handle recovery ourselves, so
          // it can restore the context once the GPU process comes back
          // instead of leaving it lost for good.
          event.preventDefault()
          const ctxEvent = event as WebGLContextEvent
          // Recovery is automatic (see onContextLost below), so this is
          // diagnostic, not a crash report. console.warn instead of
          // console.error keeps Next's dev overlay from flagging it as an
          // unhandled issue.
          // eslint-disable-next-line no-console
          console.warn('[Scene] WebGL context lost', {
            msSincePageStart: Math.round(performance.now() - startTimeRef.current),
            framesRendered: frameCountRef.current,
            statusMessage: ctxEvent.statusMessage || '(none provided)',
            glError: gl.getContext().getError(),
          })
          // R3F has no built-in recovery for a lost context, so rather than
          // hope the browser restores it and that three.js's render loop
          // notices, force a clean remount of the whole Canvas so the user
          // sees the scene come back instead of a permanently blank stage.
          onContextLost?.()
        })
        gl.domElement.addEventListener('webglcontextrestored', () => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.outputColorSpace = THREE.SRGBColorSpace
          // eslint-disable-next-line no-console
          console.info('[Scene] WebGL context restored')
        })
      }}
    >
      <ResponsiveCamera camera={camera} />
      <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#7c3aed" />
      <directionalLight position={[3.8, 4.4, 4.8]} intensity={2.2} />
      {/* Fill light on the left: the single key light above leaves that
          side of the models in shadow, this softens it without competing. */}
      <directionalLight position={[-4.2, 2.6, 3.4]} intensity={1} />
      <FrameCounter countRef={frameCountRef} />
      <Row
        items={items}
        activeIndex={activeIndex}
        onSelect={onSelect}
        dragForwardPx={dragForwardPx}
        isDragging={isDragging}
        releaseTick={releaseTick}
      />
    </Canvas>
  )
}
