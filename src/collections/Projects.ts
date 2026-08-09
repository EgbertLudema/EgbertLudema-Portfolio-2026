import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'order', 'updatedAt'],
    description: 'The list of items shown on the homepage.',
  },
  defaultSort: 'order',
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
      name: 'category',
      type: 'text',
      admin: {
        description: 'Small label shown above the title, e.g. "VISUAL STUDY · 2026"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Short description shown under the title.',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: '3D Model', value: 'model' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.type === 'image',
        description: 'Shown as the card artwork for this project.',
      },
    },
    {
      name: 'model',
      type: 'upload',
      relationTo: 'models',
      admin: {
        condition: (data) => data?.type === 'model',
        description: 'The .glb/.gltf file rendered in 3D for this project.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'accentColorA',
          type: 'text',
          defaultValue: '#f4f1ec',
          admin: {
            description: 'Gradient/accent color — used as a placeholder while no image is set, and as a subtle tint elsewhere.',
            width: '50%',
          },
        },
        {
          name: 'accentColorB',
          type: 'text',
          defaultValue: '#d8cfe8',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first in the list.',
        position: 'sidebar',
      },
    },
  ],
}
