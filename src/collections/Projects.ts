import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'

/** Selecting heading text and applying one of these ("Text Color" in the
 * toolbar) marks which section of a model/framework it belongs to, e.g. the
 * four categories of the Financieel gedrag model diagram — mirrors the
 * dot colors in PageShell.module.css's .headingPurple/.headingOrange/etc. */
const HEADING_COLOR_STATE = {
  purple: { label: 'Purple', css: { color: '#8f7cc7' } },
  orange: { label: 'Orange', css: { color: '#c07a3e' } },
  yellow: { label: 'Yellow', css: { color: '#b3902a' } },
  green: { label: 'Green', css: { color: '#4c9a67' } },
}

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
      localized: true,
      admin: {
        description: 'Small label shown above the title, e.g. "VISUAL STUDY · 2026"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Short description shown under the title.',
      },
    },
    {
      name: 'links',
      type: 'array',
      admin: {
        description:
          'External links shown on this project\'s detail page, e.g. "Visit site", "GitHub", "App Store".',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Button text, e.g. "Visit site"',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TextStateFeature({ state: { headingColor: HEADING_COLOR_STATE } }),
        ],
      }),
      admin: {
        description:
          'Full case-study write-up, shown on this project\'s detail page. To color a heading (e.g. to mark which section of a model it belongs to), select its text and use "Text Color" in the toolbar.',
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
          localized: true,
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
        { label: 'Smartphone', value: 'smartphone' },
        { label: 'Monitor', value: 'monitor' },
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
          data?.type === 'crate' ||
          data?.type === 'smartphone' ||
          data?.type === 'monitor',
        description: 'The .glb/.gltf file rendered in 3D for this project.',
      },
    },
    {
      name: 'homeScreenImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.type === 'smartphone' || data?.type === 'monitor',
        description: 'Shown on the phone/monitor screen (its homescreen, or a site screenshot).',
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
              'Gradient/accent color: used as a placeholder while no image is set, as the mat/background behind an image card (Type = Image), and as a subtle tint elsewhere.',
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
    {
      name: 'relatedProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description:
          'Other projects to cross-link on this project\'s page, e.g. a case study and the model/framework it applies. Add the link on both sides to cross-link them.',
      },
    },
  ],
}
