import type { Block } from 'payload'

/** The About page's "Experience" and "Education" lists: same layout (logo,
 * organization, period, title, skill chips, a highlighted dot for current
 * entries), so one block covers both. Add it twice with different labels. */
export const TimelineBlock: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  labels: {
    singular: 'Timeline (experience / education)',
    plural: 'Timelines',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Section label, e.g. "Experience" or "Education"',
      },
    },
    {
      name: 'items',
      type: 'array',
      admin: {
        description: 'Shown as a list. Drag to reorder.',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Company/school logo, shown next to the organization name.',
          },
        },
        {
          name: 'organization',
          type: 'text',
          required: true,
          admin: {
            description: 'Company or school name, e.g. "NHL Stenden Leeuwarden"',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Role or programme, e.g. "Freelance Web Developer"',
          },
        },
        {
          name: 'period',
          type: 'text',
          localized: true,
          admin: {
            description: 'e.g. "Feb 2024 - present"',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Optional short line about this entry.',
          },
        },
        {
          name: 'current',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: "Current / ongoing: highlights this entry's dot.",
          },
        },
        {
          name: 'skills',
          type: 'relationship',
          relationTo: 'skills',
          hasMany: true,
          admin: {
            description: 'Shown as chips beneath this entry.',
          },
        },
      ],
    },
  ],
}
