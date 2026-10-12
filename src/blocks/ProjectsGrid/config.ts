import type { Block } from 'payload'

export const ProjectsGridBlock: Block = {
  slug: 'projectsGrid',
  interfaceName: 'ProjectsGridBlock',
  labels: {
    singular: 'Projects grid',
    plural: 'Projects grids',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Section label above the grid, e.g. "Projects"',
      },
    },
    {
      name: 'showFilter',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Show skill chips above the grid that filter it. Only skills linked to at least one published project are shown.',
      },
    },
  ],
}
