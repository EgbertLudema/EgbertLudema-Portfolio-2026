import * as THREE from 'three'

/** Maps `texture` onto `mesh`'s material as a lit device screen: fit
 * (never cropped) inside the screen's own aspect ratio the same way CSS
 * `object-fit: contain` would, flipped to match the photo's natural
 * top-to-bottom order (these screen planes' UVs run the other way), and
 * driven through emissive so it reads as backlit regardless of scene
 * lighting. Pass `texture: null` to turn the screen back off. */
export function applyScreenTexture(
  mesh: THREE.Mesh,
  texture: THREE.Texture | null,
  screenAspect: number,
  imageAspect: number,
) {
  const material = mesh.material as THREE.MeshStandardMaterial

  if (texture) {
    if (imageAspect > screenAspect) {
      texture.repeat.set(1, screenAspect / imageAspect)
      texture.offset.set(0, (1 - screenAspect / imageAspect) / 2)
    } else {
      texture.repeat.set(imageAspect / screenAspect, 1)
      texture.offset.set((1 - imageAspect / screenAspect) / 2, 0)
    }
    texture.offset.y += texture.repeat.y
    texture.repeat.y = -texture.repeat.y
    texture.needsUpdate = true

    // Drive brightness through emissive alone, not map + emissive together:
    // each glb's Screen material ships its own baseColorFactor (near-black
    // on the phone, default white on the monitor), so also assigning `map`
    // let the diffuse response add an inconsistent amount on top of the
    // emissive glow, overexposing the ones with a lighter base color.
    material.map = null
    material.color.set('#000000')
    material.emissiveMap = texture
    material.emissive.set('#ffffff')
    material.emissiveIntensity = 1
    material.toneMapped = false
  } else {
    material.map = null
    material.emissiveMap = null
    material.emissiveIntensity = 0
  }
  material.needsUpdate = true
}
