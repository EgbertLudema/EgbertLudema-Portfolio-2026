import type { GlobalConfig } from 'payload'

/** Backs the /projects page (filterable project list). Kept under its
 * original 'skills-page' slug, from when this content lived at /skills,
 * to avoid a Postgres table rename/migration — the route moved, this
 * global's slug intentionally didn't. */
export const SkillsPage: GlobalConfig = {
  slug: 'skills-page',
  label: 'Projects Page',
  admin: {
    description: 'Header content for the /projects page. The project list itself comes from the Projects collection, filterable by the Skills collection.',
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
      defaultValue: 'Everything I\'ve built, filterable by skill.',
      admin: {
        description: 'Short intro shown under the title.',
      },
    },
  ],
}
