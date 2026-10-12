import type { Metadata } from 'next'

import CmsPage, { generateCmsPageMetadata } from '@/components/CmsPage'

export const revalidate = 0

type Props = { params: Promise<{ slug: string[] }> }

/** Next hands over the path already split (and URL-decoded) per segment. */
async function slugFromParams(params: Props['params']) {
  const { slug } = await params
  return slug.join('/')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateCmsPageMetadata(await slugFromParams(params))
}

/** Any page from the Pages collection, by slug, including nested ones:
 * /about, /contact, /groupbite/privacy... Static routes (/projects/...,
 * /admin, /api, /next/...) take precedence over this catch-all. */
export default async function Page({ params }: Props) {
  return <CmsPage slug={await slugFromParams(params)} />
}
