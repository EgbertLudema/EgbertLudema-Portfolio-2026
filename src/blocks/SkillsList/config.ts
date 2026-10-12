import type { Block } from 'payload'

export const SkillsListBlock: Block = {
  slug: 'skillsList',
  interfaceName: 'SkillsListBlock',
  labels: {
    singular: 'Skills list',
    plural: 'Skills lists',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Section label, e.g. "Skills"',
      },
    },
    {
      name: 'source',
      type: 'radio',
      defaultValue: 'all',
      options: [
        { label: 'All skills', value: 'all' },
        { label: 'Pick skills', value: 'selected' },
      ],
      admin: {
        layout: 'horizontal',
      },
    },
    {
      name: 'skills',
      type: 'relationship',
      relationTo: 'skills',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'selected',
      },
    },
  ],
}
