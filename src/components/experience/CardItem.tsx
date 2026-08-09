'use client'

import { RoundedBox, useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import type { ExperienceItem } from './items'
import { useGradientTexture } from './useGradientTexture'
import VaultSceneModel from './VaultSceneModel'

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

  useEffect(() => {
    if (!groupRef.current) return
    gsap.to(groupRef.current.scale, {
      x: focused ? 1 : 0.74,
      y: focused ? 1 : 0.74,
      z: focused ? 1 : 0.74,
      duration: 0.85,
      ease: 'power3.out',
    })
    gsap.to(groupRef.current.position, {
      y: focused ? 0.16 : 0,
      duration: 0.85,
      ease: 'power3.out',
    })
    gsap.to(groupRef.current.rotation, {
      y: focused ? -0.06 : -0.26,
      duration: 0.85,
      ease: 'power3.out',
    })
    if (cardMatRef.current) {
      gsap.to(cardMatRef.current, {
        opacity: focused ? 1 : 0.55,
        duration: 0.85,
        ease: 'power3.out',
      })
    }
  }, [focused])

  return (
    <group
      ref={groupRef}
      rotation={[0, -0.26, 0]}
      scale={0.74}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {item.type === 'model' && item.modelPath ? (
        <VaultSceneModel modelUrl={item.modelPath} focused={focused} scale={VAULT_SCALE} />
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
