import { getPayload } from 'payload'

import config from '@payload-config'
import ExperienceLoader from '@/components/experience/ExperienceLoader'
import type { ExperienceItem } from '@/components/experience/items'
import { getLocale } from '@/lib/getLocale'

export const revalidate = 0

export default async function HomePage() {
  const payload = await getPayload({ config })
  const locale = await getLocale()

  const [{ docs }, contactPage] = await Promise.all([
    payload.find({
      collection: 'projects',
      sort: 'order',
      depth: 1,
      limit: 100,
      locale,
    }),
    payload.findGlobal({ slug: 'contact-page', locale }),
  ])

  const socials = (contactPage.socials ?? [])
    .filter((social): social is { label: string; url: string; id?: string | null } =>
      Boolean(social?.label && social?.url),
    )
    .map((social) => ({ id: social.id ?? social.label, label: social.label, url: social.url }))

  const items: ExperienceItem[] = docs.map((doc) => {
    const image = typeof doc.image === 'object' && doc.image ? doc.image : null
    const model = typeof doc.model === 'object' && doc.model ? doc.model : null
    const homeScreenImage =
      typeof doc.homeScreenImage === 'object' && doc.homeScreenImage ? doc.homeScreenImage : null
    const aspect = image?.width && image?.height ? image.width / image.height : undefined
    const screenAspect =
      homeScreenImage?.width && homeScreenImage?.height
        ? homeScreenImage.width / homeScreenImage.height
        : undefined

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
      screenImagePath: homeScreenImage?.url ?? undefined,
      screenImageAspect: screenAspect,
    }
  })

  return (
    <ExperienceLoader
      items={items}
      locale={locale}
      contact={{ email: contactPage.email, socials }}
    />
  )
}
