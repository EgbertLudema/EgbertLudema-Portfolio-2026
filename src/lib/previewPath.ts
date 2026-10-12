/** Admin "Preview" / Live Preview URL for a document: goes through
 * /next/preview, which checks the admin is logged in and turns on Next's
 * draft mode before redirecting to the real page, so it renders the latest
 * draft instead of the published version. Relative, since the admin panel
 * and the frontend share an origin. */
export function previewPath(path: string) {
  return `/next/preview?${new URLSearchParams({ path }).toString()}`
}

/** Frontend path of a Page document. Slugs are flat: /about, /contact... */
export function pagePath(slug: string | null | undefined) {
  return `/${slug ?? ''}`
}

/** Frontend path of a Project document. */
export function projectPath(slug: string | null | undefined) {
  return `/projects/${slug ?? ''}`
}
