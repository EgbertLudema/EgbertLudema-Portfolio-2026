import type { GlobalConfig } from 'payload'

/** Site-wide contact info. Kept under its original 'contact-page' slug
 * (from when it also held the /contact page's copy) to avoid a Postgres
 * table rename: the page itself now lives in the Pages collection. */
export const ContactPage: GlobalConfig = {
  slug: 'contact-page',
  label: 'Contact Details',
  admin: {
    description:
      'Email and social links used in the site footer, on the homepage, and in any page hero with "Show contact details" turned on.',
  },
  access: {
    read: () => true,
  },
  fields: [
    // Legacy: the old /contact page header, superseded by the "contact"
    // page in the Pages collection, which this was copied into. Hidden;
    // safe to delete.
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { hidden: true },
    },
    {
      name: 'category',
      type: 'text',
      localized: true,
      admin: { hidden: true },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: { hidden: true },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { hidden: true },
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
