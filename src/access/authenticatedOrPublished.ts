import type { Access } from 'payload'

/** Logged-in admins can read everything (drafts included, which the admin
 * panel and preview need); everyone else only gets published documents.
 * Note the Local API skips access control unless `overrideAccess: false`
 * is passed, so frontend queries also filter on `_status` themselves. */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
