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
  ],
}
