import type { GlobalConfig } from 'payload'

export const SkillsPage: GlobalConfig = {
  slug: 'skills-page',
  label: 'Skills Page',
  admin: {
    description: 'Header content for the /skills page. The skill list itself comes from the Skills collection.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'category',
      type: 'text',
      localized: true,
      defaultValue: 'SKILLS · 2026',
      admin: {
        description: 'Small label shown above the title, e.g. "SKILLS · 2026"',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Skills',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        "Every skill used across my projects. Hovering one will soon show which projects it's linked to.",
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
  ],
}
