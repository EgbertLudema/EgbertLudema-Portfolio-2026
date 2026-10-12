import type { Field } from 'payload'

/** Top of every page: category label, the page title as heading, intro
 * text, optional portrait photo and a row of link buttons. Covers what the
 * old About (photo + CV button), Contact (photo + email/socials) and
 * Projects (text only) page headers each did. */
export const hero: Field = {
  name: 'hero',
  type: 'group',
  label: false,
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional portrait photo shown beside the heading.',
      },
    },
    {
      name: 'category',
      type: 'text',
      localized: true,
      admin: {
        description: 'Small label shown above the title, e.g. "ABOUT · 2026"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
    {
      name: 'showContactDetails',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show the email address and social links from the "Contact Details" global under the intro.',
      },
    },
    {
      name: 'links',
      type: 'array',
      admin: {
        description: 'Buttons under the intro, e.g. "Download CV" or "GitHub".',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'url',
          options: [
            { label: 'Link', value: 'url' },
            { label: 'File download', value: 'file' },
          ],
          admin: {
            layout: 'horizontal',
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type !== 'file',
          },
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'documents',
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'file',
            description: 'Can differ per language, e.g. an English and a Dutch CV.',
          },
        },
      ],
    },
  ],
}
