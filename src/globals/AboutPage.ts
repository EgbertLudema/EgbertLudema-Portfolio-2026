import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About Page',
  admin: {
    description: 'Content for the /about page.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Portrait photo shown on the About page.',
      },
    },
    {
      name: 'category',
      type: 'text',
      localized: true,
      defaultValue: 'ABOUT · 2026',
      admin: {
        description: 'Small label shown above the title, e.g. "ABOUT · 2026"',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'About me',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        "Placeholder bio, replace with a real introduction: who you are, what you build, and what you're looking for next.",
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Optional longer write-up, shown below the intro. Blank lines start a new paragraph; lines starting with "- " become a bullet list.',
      },
    },
    {
      name: 'education',
      type: 'array',
      label: 'Education',
      admin: {
        description: 'Schools/programmes, shown as a list on the About page. Drag to reorder.',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'School logo, shown next to the institution name.',
          },
        },
        {
          name: 'institution',
          type: 'text',
          required: true,
          admin: {
            description: 'School name, e.g. "NHL Stenden Leeuwarden"',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Programme/degree, e.g. "Communication & Multimedia Design"',
          },
        },
        {
          name: 'period',
          type: 'text',
          localized: true,
          admin: {
            description: 'e.g. "2024 - present"',
          },
        },
        {
          name: 'current',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Current / ongoing — highlights this entry\'s dot on the About page.',
          },
        },
        {
          name: 'skills',
          type: 'relationship',
          relationTo: 'skills',
          hasMany: true,
          admin: {
            description: 'Skills linked to this programme, shown as chips beneath it.',
          },
        },
      ],
    },
    {
      name: 'experience',
      type: 'array',
      label: 'Work Experience',
      admin: {
        description: 'Jobs/roles, shown as a list on the About page. Drag to reorder.',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Company logo, shown next to the company name.',
          },
        },
        {
          name: 'company',
          type: 'text',
          required: true,
          admin: {
            description: 'Company name, e.g. "EL-Websolutions"',
          },
        },
        {
          name: 'role',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Job title, e.g. "Freelance Web Developer"',
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
            description: 'Optional short line about the role.',
          },
        },
        {
          name: 'current',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Current / ongoing — highlights this entry\'s dot on the About page.',
          },
        },
        {
          name: 'skills',
          type: 'relationship',
          relationTo: 'skills',
          hasMany: true,
          admin: {
            description: 'Skills used in this role, shown as chips beneath it.',
          },
        },
      ],
    },
  ],
}
