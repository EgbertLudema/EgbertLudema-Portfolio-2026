import { getPayload } from 'payload'

import config from '@payload-config'
import ExperienceLoader from '@/components/experience/ExperienceLoader'
import type { ExperienceItem } from '@/components/experience/items'

export const revalidate = 0

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    sort: 'order',
    depth: 1,
    limit: 100,
  })

  const items: ExperienceItem[] = docs.map((doc) => {
    const image = typeof doc.image === 'object' && doc.image ? doc.image : null
    const model = typeof doc.model === 'object' && doc.model ? doc.model : null
    const aspect = image?.width && image?.height ? image.width / image.height : undefined

    return {
      id: doc.slug || String(doc.id),
      slug: doc.slug,
      type: doc.type,
      title: doc.title,
      category: doc.category ?? '',
      description: doc.description,
      colorA: doc.accentColorA || '#f4f1ec',
      colorB: doc.accentColorB || '#d8cfe8',
      modelPath: model?.url ?? undefined,
      imagePath: image?.url ?? undefined,
      imageAspect: aspect,
    }
  })

  return <ExperienceLoader items={items} />
}
