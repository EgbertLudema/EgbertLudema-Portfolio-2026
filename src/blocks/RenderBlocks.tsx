import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import ContentBlock from './Content/Component'
import MediaBlock from './MediaBlock/Component'
import ProjectsGridBlock from './ProjectsGrid/Component'
import SkillsListBlock from './SkillsList/Component'
import TimelineBlock from './Timeline/Component'

/** Renders a page's `layout` blocks in order. */
export default function RenderBlocks({
  blocks,
  locale,
}: {
  blocks: NonNullable<Page['layout']>
  locale: Locale
}) {
  return blocks.map((block, index) => {
    const key = block.id ?? index
    switch (block.blockType) {
      case 'content':
        return <ContentBlock key={key} {...block} />
      case 'timeline':
        return <TimelineBlock key={key} {...block} />
      case 'skillsList':
        return <SkillsListBlock key={key} {...block} />
      case 'projectsGrid':
        return <ProjectsGridBlock key={key} {...block} locale={locale} />
      case 'mediaBlock':
        return <MediaBlock key={key} {...block} />
      default:
        return null
    }
  })
}
