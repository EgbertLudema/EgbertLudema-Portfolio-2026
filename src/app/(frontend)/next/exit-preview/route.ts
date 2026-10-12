import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')
  const draft = await draftMode()
  draft.disable()
  redirect(path && path.startsWith('/') && !path.startsWith('//') ? path : '/')
}
