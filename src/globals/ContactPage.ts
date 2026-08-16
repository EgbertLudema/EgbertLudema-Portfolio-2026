import type { GlobalConfig } from 'payload'

export const ContactPage: GlobalConfig = {
  slug: 'contact-page',
  label: 'Contact Page',
  admin: {
    description: 'Content for the /contact page.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'category',
      type: 'text',
      localized: true,
      defaultValue: 'CONTACT · 2026',
      admin: {
        description: 'Small label shown above the title, e.g. "CONTACT · 2026"',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Contact',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue: 'Reach out about a project, a collaboration, or anything else.',
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      defaultValue: 'egbertludema2001@gmail.com',
      admin: {
        description: 'Shown as a mailto: link.',
      },
    },
    {
      name: 'socials',
      type: 'array',
      label: 'Socials',
      admin: {
        description: 'Social links shown on the contact page, e.g. LinkedIn, GitHub, Instagram. Drag to reorder.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Platform name, e.g. "LinkedIn"',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
