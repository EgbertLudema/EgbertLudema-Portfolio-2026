// Shape the homepage list is rendered from. Content itself now lives in
// Payload (the "Projects" collection) — see src/app/(frontend)/page.tsx for
// where Payload documents are mapped into this shape.
export type ExperienceItem = {
  /** Slug when available, otherwise the Payload document id — stable across
   *  edits and ready to key a future project page/modal route off of. */
  id: string
  slug: string
  type: 'image' | 'model'
  title: string
  category: string
  description: string
  colorA: string
  colorB: string
  modelPath?: string
  imagePath?: string
  imageAspect?: number
}
