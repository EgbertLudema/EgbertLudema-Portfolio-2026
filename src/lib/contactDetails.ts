import { cache } from 'react'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Locale } from './locale'

export type ContactDetails = {
  email: string
  socials: { id: string; label: string; url: string }[]
}

/** Site-wide email + socials (the "Contact Details" global), read by the
 * footer, the homepage and page heroes. Cached per request, since a single
 * page can render several of those. */
export const getContactDetails = cache(async (locale: Locale): Promise<ContactDetails> => {
  const payload = await getPayload({ config })
  const contact = await payload.findGlobal({ slug: 'contact-page', locale, depth: 0 })

  return {
    email: contact.email,
    socials: (contact.socials ?? [])
      .filter((social) => Boolean(social?.label && social?.url))
      .map((social) => ({ id: social.id ?? social.label, label: social.label, url: social.url })),
  }
})
