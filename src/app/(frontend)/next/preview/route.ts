import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'

/** Target of the admin's Preview button and Live Preview iframe (see
 * lib/previewPath.ts). Only logged-in admins get draft mode turned on;
 * it makes page/project routes render the latest draft. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')
  // Same-origin paths only, so this can't be used as an open redirect.
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return new Response('Log in to the admin panel to preview drafts', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
