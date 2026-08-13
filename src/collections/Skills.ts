import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',
  labels: {
    singular: 'Skill',
    plural: 'Skills',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Skills that can be linked to projects, powering a future skills-hover section.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Short description of this skill.',
      },
    },
  ],
}
