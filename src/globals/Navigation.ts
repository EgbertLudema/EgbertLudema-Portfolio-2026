import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    description:
      'Links in the site header (after "Home"), on every page including the homepage. Links to unpublished pages are left out automatically.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'links',
      type: 'array',
      admin: {
        description: 'Drag to reorder.',
      },
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'page',
          options: [
            { label: 'Page', value: 'page' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: {
            layout: 'horizontal',
          },
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          admin: {
            condition: (_, siblingData) => siblingData?.type !== 'custom',
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'custom',
            description: 'e.g. "/projects/vault" or "https://github.com/...". External links open in a new tab.',
          },
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          admin: {
            description: 'Leave empty to use the page title.',
          },
        },
      ],
    },
  ],
}
