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
      name: 'content',
      type: 'textarea',
      admin: {
        description: "Full case-study write-up, shown on this project's detail page.",
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Large image at the top of the project detail page.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      admin: {
        description:
          'Extra images further down the project detail page, each with an optional caption.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: '3D Model', value: 'model' },
        { label: 'Figma Stack', value: 'figma' },
        { label: 'Node Graph', value: 'nodegraph' },
        { label: 'Dice', value: 'dice' },
        { label: 'Crate', value: 'crate' },
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
        condition: (data) =>
          data?.type === 'model' ||
          data?.type === 'figma' ||
          data?.type === 'nodegraph' ||
          data?.type === 'dice' ||
          data?.type === 'crate',
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
            description:
              'Gradient/accent color: used as a placeholder while no image is set, and as a subtle tint elsewhere.',
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
    {
      name: 'skills',
      type: 'relationship',
      relationTo: 'skills',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Skills used on this project, powering the future skills-hover section.',
      },
    },
  ],
}
