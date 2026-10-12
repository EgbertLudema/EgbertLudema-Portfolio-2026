import { cache } from 'react'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { NavLink } from '@/components/NavItemLink'
import type { Locale } from './locale'
import { pagePath } from './previewPath'
import { isPublishedDoc } from './published'

/** Header links from the Navigation global, in order. Links to pages that
 * aren't published (or were deleted) are dropped rather than 404ing. */
export const getNavLinks = cache(async (locale: Locale): Promise<NavLink[]> => {
  const payload = await getPayload({ config })
  const navigation = await payload.findGlobal({ slug: 'navigation', locale, depth: 1 })

  return (navigation.links ?? []).flatMap((link): NavLink[] => {
    if (link.type === 'custom') {
      if (!link.url) return []
      return [
        {
          id: link.id ?? link.url,
          href: link.url,
          label: link.label || link.url,
          external: /^https?:\/\//.test(link.url),
        },
      ]
    }

    const page = typeof link.page === 'object' ? link.page : null
    if (!page || !isPublishedDoc(page)) return []
    return [
      {
        id: link.id ?? String(page.id),
        href: pagePath(page.slug),
        label: link.label || page.title,
        external: false,
      },
    ]
  })
})
