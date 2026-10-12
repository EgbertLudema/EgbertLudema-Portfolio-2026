import type { Where } from 'payload'

/** Frontend queries run through the Local API, which skips access control,
 * so drafts have to be filtered out explicitly. */
export const isPublished: Where = {
  _status: {
    equals: 'published',
  },
}

/** For relationships populated off a published doc, e.g. a project's
 * relatedProjects: the population itself doesn't filter drafts out. */
export function isPublishedDoc(doc: { _status?: 'draft' | 'published' | null }) {
  return doc._status === 'published'
}
