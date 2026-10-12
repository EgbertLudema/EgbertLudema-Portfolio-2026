import type { Metadata } from 'next'

import CmsPage, { generateCmsPageMetadata } from '@/components/CmsPage'

export const revalidate = 0

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateCmsPageMetadata(slug)
}

/** Any page from the Pages collection, by slug: /about, /contact, ... */
export default async function Page({ params }: Props) {
  const { slug } = await params
  return <CmsPage slug={slug} />
}
