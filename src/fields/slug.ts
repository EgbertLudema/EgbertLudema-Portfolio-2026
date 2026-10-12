import type { CollectionBeforeValidateHook, RowField, TextField } from 'payload'
import { slugField, ValidationError } from 'payload'

type SlugOptions = {
  /** Allow "/" in slugs for nested paths, e.g. "groupbite/privacy". */
  nested?: boolean
}

function slugifySegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "My Title" -> "my-title"; with `nested`, "/GroupBite/Privacy/" ->
 * "groupbite/privacy" (each segment slugified, stray slashes dropped). */
export function toSlug(value: unknown, { nested = false }: SlugOptions = {}): string | undefined {
  if (typeof value !== 'string') return undefined
  const segments = (nested ? value.split('/') : [value]).map(slugifySegment).filter(Boolean)
  return segments.length > 0 ? segments.join('/') : undefined
}

/** Payload's slugField (sidebar input with Lock/Generate buttons), but with
 * its own auto-generation hook switched off: `fillSlug` below does the
 * generating instead, which also handles nested slugs and stops following
 * the title once a document has been published. */
export function slug(options: SlugOptions = {}): RowField {
  return slugField({
    slugify: ({ valueToSlugify }) => toSlug(valueToSlugify, options),
    overrides: (row) => {
      const [checkbox] = row.fields
      const slugInput = row.fields[1] as TextField
      // The hidden "generateSlug" checkbox stays (it's a DB column) but inert.
      if ('hooks' in checkbox) checkbox.hooks = {}
      slugInput.admin = {
        ...slugInput.admin,
        description: options.nested
          ? 'Leave empty to use the title. Use "/" for nested paths, e.g. "groupbite/privacy".'
          : 'Leave empty to use the title.',
      }
      return row
    },
  })
}

/** Collection beforeValidate hook, run on every save:
 * - An empty slug is filled in from the title.
 * - A slug that still equals the previous title's slug (i.e. it was
 *   generated, never customized) keeps following the title, until the
 *   document is published, so live URLs don't change by themselves.
 * - Any other slug is yours: it's only cleaned up (lowercase, dashes).
 * A save that doesn't include `slug` (e.g. an API update of other fields)
 * leaves an existing slug alone. */
export function fillSlug({
  nested = false,
  reserved = [],
}: SlugOptions & {
  /** Paths taken by other routes: "admin" blocks "admin" and "admin/...";
   * "projects/" (trailing slash) blocks only what's nested under it. */
  reserved?: string[]
} = {}): CollectionBeforeValidateHook {
  return ({ collection, data, originalDoc }) => {
    if (!data) return data

    const typed = toSlug(data.slug, { nested })
    const fromTitle = toSlug(data.title)

    if (!typed) {
      if (fromTitle && ('slug' in data || !originalDoc?.slug)) data.slug = fromTitle
    } else if (
      fromTitle &&
      originalDoc &&
      originalDoc._status !== 'published' &&
      typed === toSlug(originalDoc.title)
    ) {
      data.slug = fromTitle
    } else {
      data.slug = typed
    }

    const value = typeof data.slug === 'string' ? data.slug : ''
    const taken = reserved.find((path) =>
      path.endsWith('/') ? value.startsWith(path) : value === path || value.startsWith(`${path}/`),
    )
    if (taken) {
      throw new ValidationError({
        collection: collection.slug,
        errors: [{ message: `"/${value}" is already used by the site itself, pick another slug.`, path: 'slug' }],
      })
    }

    return data
  }
}
