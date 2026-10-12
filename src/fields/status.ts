import type { SelectField } from 'payload'

/** Plain Draft / Published switch, saved with the regular Save button (no
 * versions, no autosave). Named `_status` and shaped exactly like the field
 * Payload adds for drafts, so it reuses that existing database column and
 * the "published only" filters (lib/published.ts, access control) work
 * unchanged. Drafts are hidden from the site, but can still be checked
 * with the admin's Preview button. */
export const statusField: SelectField = {
  name: '_status',
  type: 'select',
  label: 'Status',
  defaultValue: 'draft',
  index: true,
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  admin: {
    position: 'sidebar',
    description: 'Only published items are visible on the site.',
  },
}
