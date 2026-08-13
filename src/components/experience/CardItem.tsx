'use client'

import { RoundedBox, useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import CrateModel from './CrateModel'
import DiceModel from './DiceModel'
import FigmaStackModel from './FigmaStackModel'
import NodeGraphModel from './NodeGraphModel'
import type { ExperienceItem } from './items'
import { useGradientTexture } from './useGradientTexture'
import VaultSceneModel from './ModelSceneItem'

const CARD_WIDTH = 0.65
const CARD_HEIGHT = 0.85
const CARD_ASPECT = CARD_WIDTH / CARD_HEIGHT
const VAULT_SCALE = CARD_HEIGHT * 0.68
/** An uploaded photo, cropped to cover the card the same way CSS `object-fit:
 * cover` would, using the image's known aspect ratio (from Payload) rather
 * than waiting on the texture to load to avoid a layout jump. */
function ImageCardFace({
  imagePath,
  imageAspect,
  matRef,
}: {
  imagePath: string
  imageAspect?: number
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>
}) {
  const texture = useTexture(imagePath)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    const aspect = imageAspect ?? CARD_ASPECT

    if (aspect > CARD_ASPECT) {
      texture.repeat.set(CARD_ASPECT / aspect, 1)
      texture.offset.set((1 - CARD_ASPECT / aspect) / 2, 0)
    } else {
      texture.repeat.set(1, aspect / CARD_ASPECT)
      texture.offset.set(0, (1 - aspect / CARD_ASPECT) / 2)
    }
    texture.needsUpdate = true
  }, [texture, imageAspect])

  return (
    <RoundedBox args={[CARD_WIDTH, CARD_HEIGHT, 0.05]} radius={0.045} smoothness={4}>
      <meshStandardMaterial
        ref={matRef}
        map={texture}
        roughness={0.65}
        metalness={0.04}
        transparent
        opacity={0.55}
      />
    </RoundedBox>
  )
}

/** Procedural placeholder used until a project has a real image uploaded. */
function GradientCardFace({
  colorA,
  colorB,
  matRef,
}: {
  colorA: string
  colorB: string
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>
}) {
  const texture = useGradientTexture(colorA, colorB)

  return (
    <RoundedBox args={[CARD_WIDTH, CARD_HEIGHT, 0.05]} radius={0.045} smoothness={4}>
      <meshStandardMaterial
        ref={matRef}
        map={texture ?? undefined}
        color={texture ? '#ffffff' : colorA}
        roughness={0.65}
        metalness={0.04}
        transparent
        opacity={0.55}
      />
    </RoundedBox>
  )
}

export default function CardItem({
  item,
  focused,
  onSelect,
}: {
  item: ExperienceItem
  focused: boolean
  onSelect: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const cardMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const debugStore = useDebugStore()

  const tuning = useControls(
    'Card Group',
    {
      unfocusedScale: { value: 0.74, min: 0.1, max: 2, step: 0.01 },
      unfocusedRotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      unfocusedRotationY: { value: -0.26, min: -Math.PI, max: Math.PI, step: 0.01 },
      unfocusedRotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      focusedScale: { value: 1, min: 0.1, max: 2, step: 0.01 },
      focusedRotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      focusedRotationY: { value: -0.06, min: -Math.PI, max: Math.PI, step: 0.01 },
      focusedRotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      focusedPositionY: { value: 0.16, min: -2, max: 2, step: 0.01 },
      tweenDuration: { value: 0.85, min: 0.1, max: 3, step: 0.01 },
    },
    { store: debugStore ?? undefined },
  )

  useEffect(() => {
    if (!groupRef.current) return
    gsap.to(groupRef.current.scale, {
      x: focused ? tuning.focusedScale : tuning.unfocusedScale,
      y: focused ? tuning.focusedScale : tuning.unfocusedScale,
      z: focused ? tuning.focusedScale : tuning.unfocusedScale,
      duration: tuning.tweenDuration,
      ease: 'power3.out',
    })
    gsap.to(groupRef.current.position, {
      y: focused ? tuning.focusedPositionY : 0,
      duration: tuning.tweenDuration,
      ease: 'power3.out',
    })
    gsap.to(groupRef.current.rotation, {
      x: focused ? tuning.focusedRotationX : tuning.unfocusedRotationX,
      y: focused ? tuning.focusedRotationY : tuning.unfocusedRotationY,
      z: focused ? tuning.focusedRotationZ : tuning.unfocusedRotationZ,
      duration: tuning.tweenDuration,
      ease: 'power3.out',
    })
    if (cardMatRef.current) {
      gsap.to(cardMatRef.current, {
        opacity: focused ? 1 : 0.55,
        duration: tuning.tweenDuration,
        ease: 'power3.out',
      })
    }
  }, [focused, tuning])

  return (
    <group
      ref={groupRef}
      rotation={[tuning.unfocusedRotationX, tuning.unfocusedRotationY, tuning.unfocusedRotationZ]}
      scale={tuning.unfocusedScale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {item.type === 'model' && item.modelPath ? (
        <VaultSceneModel
          modelUrl={item.modelPath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.type === 'figma' && item.modelPath ? (
        <FigmaStackModel
          modelUrl={item.modelPath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.type === 'nodegraph' && item.modelPath ? (
        <NodeGraphModel
          modelUrl={item.modelPath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.type === 'dice' && item.modelPath ? (
        <DiceModel
          modelUrl={item.modelPath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.type === 'crate' && item.modelPath ? (
        <CrateModel
          modelUrl={item.modelPath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.imagePath ? (
        <ImageCardFace
          imagePath={item.imagePath}
          imageAspect={item.imageAspect}
          matRef={cardMatRef}
        />
      ) : (
        <GradientCardFace colorA={item.colorA} colorB={item.colorB} matRef={cardMatRef} />
      )}
    </group>
  )
}
