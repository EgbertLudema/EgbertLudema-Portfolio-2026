import type { GlobalConfig } from 'payload'

/** Legacy: the old /projects page header, superseded by the "projects"
 * page in the Pages collection, which its content was copied into. Hidden
 * from the admin; safe to delete (dropping its Postgres tables). */
export const SkillsPage: GlobalConfig = {
  slug: 'skills-page',
  label: 'Projects Page (legacy)',
  admin: {
    hidden: true,
    description:
      'Header content for the /projects page. The project list itself comes from the Projects collection, filterable by the Skills collection.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'category',
      type: 'text',
      localized: true,
      defaultValue: 'PROJECTS · 2026',
      admin: {
        description: 'Small label shown above the title, e.g. "PROJECTS · 2026"',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Projects',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue: "Everything I've built, filterable by skill.",
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
  ],
}
