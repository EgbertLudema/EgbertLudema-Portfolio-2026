import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { ContentBlock } from '../blocks/Content/config'
import { MediaBlock } from '../blocks/MediaBlock/config'
import { ProjectsGridBlock } from '../blocks/ProjectsGrid/config'
import { SkillsListBlock } from '../blocks/SkillsList/config'
import { TimelineBlock } from '../blocks/Timeline/config'
import { fillSlug, slug } from '../fields/slug'
import { hero } from '../heros/config'
import { pagePath, previewPath } from '../lib/previewPath'

/** Paths already taken by the app itself: a page there would never be
 * reachable. 'projects' itself is fine (/projects renders the page with that
 * slug); only what's under it is taken, by the project detail pages. */
const RESERVED_PATHS = ['admin', 'api', 'next', 'my-route', 'projects/']

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Pages served at /<slug> (nested slugs like "groupbite/privacy" work too), built from a hero and content blocks. Only published pages are visible on the site.',
    livePreview: {
      url: ({ data }) => previewPath(pagePath(data?.slug)),
    },
    preview: (data) => previewPath(pagePath(data?.slug as string | undefined)),
  },
  access: {
    read: authenticatedOrPublished,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
    maxPerDoc: 50,
  },
  hooks: {
    beforeValidate: [fillSlug({ nested: true, reserved: RESERVED_PATHS })],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Page heading, also used as the browser tab title.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [ContentBlock, TimelineBlock, SkillsListBlock, ProjectsGridBlock, MediaBlock],
              admin: {
                description: 'Sections shown below the hero, top to bottom. Drag to reorder.',
                initCollapsed: true,
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              admin: {
                description: 'Browser tab / search result title. Defaults to the page title.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Search result description. Defaults to the hero intro.',
              },
            },
          ],
        },
      ],
    },
    slug({ nested: true }),
  ],
}
