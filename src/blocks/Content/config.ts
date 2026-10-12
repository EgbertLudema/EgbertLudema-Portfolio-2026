import type { Block } from 'payload'

import { caseStudyEditor } from '../../fields/caseStudyEditor'

export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: {
    singular: 'Content',
    plural: 'Content blocks',
  },
  fields: [
    {
      name: 'richText',
      label: 'Content',
      type: 'richText',
      localized: true,
      editor: caseStudyEditor,
      admin: {
        description:
          'Free-form text with headings, lists and links. To color a heading, select its text and use "Text Color" in the toolbar.',
      },
    },
  ],
}
