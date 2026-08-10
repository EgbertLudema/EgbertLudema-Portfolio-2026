'use client'

import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import CardItem from './CardItem'
import type { ExperienceItem } from './items'

export const SPACING = 1.3

function Row({
  items,
  activeIndex,
  onSelect,
}: {
  items: ExperienceItem[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    gsap.to(groupRef.current.position, {
      x: -activeIndex * SPACING,
      duration: 1,
      ease: 'power3.out',
    })
  }, [activeIndex])

  return (
    <group ref={groupRef}>
      {items.map((item, index) => (
        <group key={item.id} position={[index * SPACING, 0, 0]}>
          <CardItem item={item} focused={index === activeIndex} onSelect={() => onSelect(index)} />
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

export default function Scene({
  items,
  activeIndex,
  onSelect,
  onContextLost,
}: {
  items: ExperienceItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onContextLost?: () => void
}) {
  const frameCountRef = useRef(0)
  const startTimeRef = useRef(0)

  return (
    <Canvas
      dpr={1}
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
          // diagnostic, not a crash report — console.warn instead of
          // console.error keeps Next's dev overlay from flagging it as an
          // unhandled issue.
          // eslint-disable-next-line no-console
          console.warn('[Scene] WebGL context lost', {
            msSincePageStart: Math.round(performance.now() - startTimeRef.current),
            framesRendered: frameCountRef.current,
            statusMessage: ctxEvent.statusMessage || '(none provided)',
            glError: gl.getContext().getError(),
          })
          // R3F has no built-in recovery for a lost context — rather than
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
      <PerspectiveCamera
        makeDefault
        fov={40}
        position={[-2.6, 1.1, 6.4]}
        onUpdate={(camera) => camera.lookAt(0.8, 0, 0)}
      />
      <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#7c3aed" />
      <directionalLight position={[3.8, 4.4, 4.8]} intensity={2.2} />
      {/* Fill light on the left — the single key light above leaves that
          side of the models in shadow, this softens it without competing. */}
      <directionalLight position={[-4.2, 2.6, 3.4]} intensity={1} />
      <FrameCounter countRef={frameCountRef} />
      <Row items={items} activeIndex={activeIndex} onSelect={onSelect} />
    </Canvas>
  )
}
