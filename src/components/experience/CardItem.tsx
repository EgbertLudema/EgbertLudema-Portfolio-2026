'use client'

import { RoundedBox, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import CrateModel from './CrateModel'
import DiceModel from './DiceModel'
import FigmaStackModel from './FigmaStackModel'
import MonitorModel from './MonitorModel'
import NodeGraphModel from './NodeGraphModel'
import PhoneModel from './PhoneModel'
import TiltGroup from './TiltGroup'
import type { ExperienceItem } from './items'
import { useGradientTexture } from './useGradientTexture'
import VaultSceneModel from './ModelSceneItem'

const CARD_WIDTH = 0.65
const CARD_HEIGHT = 0.85
const CARD_ASPECT = CARD_WIDTH / CARD_HEIGHT
const VAULT_SCALE = CARD_HEIGHT * 0.68
const IMAGE_INSET = 0.88

/** An uploaded photo, contained (never cropped) within the same fixed card
 * frame every other card uses, so the row stays visually consistent
 * instead of each image card being an oddly different width. The frame
 * itself is tinted with the project's `colorA` (set in the admin), acting
 * as a mat around the image the way a printed photo would be matted. */
function ImageCardFace({
  imagePath,
  imageAspect,
  colorA,
  matRef,
}: {
  imagePath: string
  imageAspect?: number
  colorA: string
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>
}) {
  const texture = useTexture(imagePath)
  const imageMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const aspect = imageAspect ?? CARD_ASPECT

  let imageWidth: number
  let imageHeight: number
  if (aspect > CARD_ASPECT) {
    imageWidth = CARD_WIDTH * IMAGE_INSET
    imageHeight = imageWidth / aspect
  } else {
    imageHeight = CARD_HEIGHT * IMAGE_INSET
    imageWidth = imageHeight * aspect
  }

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.repeat.set(1, 1)
    texture.offset.set(0, 0)
    texture.needsUpdate = true
  }, [texture])

  // The mat's opacity is already driven by CardItem's focus tween (via
  // matRef); mirror it onto the image plane's own material each frame so
  // both fade together without a second tween to keep in sync.
  useFrame(() => {
    if (imageMatRef.current && matRef.current) {
      imageMatRef.current.opacity = matRef.current.opacity
    }
  })

  return (
    <group>
      <RoundedBox args={[CARD_WIDTH, CARD_HEIGHT, 0.05]} radius={0.045} smoothness={4}>
        <meshStandardMaterial
          ref={matRef}
          color={colorA}
          roughness={0.65}
          metalness={0.04}
          transparent
          opacity={0.55}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.0255]}>
        <planeGeometry args={[imageWidth, imageHeight]} />
        <meshStandardMaterial
          ref={imageMatRef}
          map={texture}
          roughness={0.65}
          metalness={0.04}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
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
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'auto'
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
      ) : item.type === 'smartphone' && item.modelPath ? (
        <PhoneModel
          modelUrl={item.modelPath}
          screenImageUrl={item.screenImagePath}
          screenImageAspect={item.screenImageAspect}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.type === 'monitor' && item.modelPath ? (
        <MonitorModel
          modelUrl={item.modelPath}
          screenImageUrl={item.screenImagePath}
          focused={focused}
          scale={VAULT_SCALE}
          label={item.title}
        />
      ) : item.imagePath ? (
        <TiltGroup focused={focused}>
          <ImageCardFace
            imagePath={item.imagePath}
            imageAspect={item.imageAspect}
            colorA={item.colorA}
            matRef={cardMatRef}
          />
        </TiltGroup>
      ) : (
        <TiltGroup focused={focused}>
          <GradientCardFace colorA={item.colorA} colorB={item.colorB} matRef={cardMatRef} />
        </TiltGroup>
      )}
    </group>
  )
}
