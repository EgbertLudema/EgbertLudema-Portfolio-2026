import type { Metadata } from 'next'

import CmsPage, { generateCmsPageMetadata } from '@/components/CmsPage'

export const revalidate = 0

/** /projects has its own folder (for /projects/[slug]), so it can't fall
 * through to ../[...slug]: render the "projects" page from the Pages
 * collection here explicitly. Its Projects grid block is what lists them. */
export async function generateMetadata(): Promise<Metadata> {
  return generateCmsPageMetadata('projects')
}

export default function ProjectsPage() {
  return <CmsPage slug="projects" />
}
