// Shape the homepage list is rendered from. Content itself now lives in
// Payload (the "Projects" collection): see src/app/(frontend)/page.tsx for
// where Payload documents are mapped into this shape.
export type ExperienceItem = {
  /** Slug when available, otherwise the Payload document id. Stable across
   *  edits and ready to key a future project page/modal route off of. */
  id: string
  slug: string
  type: 'image' | 'model' | 'figma' | 'nodegraph' | 'dice' | 'crate' | 'smartphone' | 'monitor'
  title: string
  category: string
  description: string
  colorA: string
  colorB: string
  modelPath?: string
  imagePath?: string
  imageAspect?: number
  screenImagePath?: string
  screenImageAspect?: number
}
