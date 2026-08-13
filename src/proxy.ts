import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Payload's built-in upload file-serving route sends no cache headers at
 * all, so the browser re-downloads (and, for the 3D model, re-parses) the
 * full file on every fetch. For a multi-megabyte .glb loaded via useGLTF,
 * which can genuinely fetch twice in quick succession because of React's
 * Suspense double-invoke behavior in dev, that repeated cost was enough to
 * destabilize the GPU process. These files are effectively immutable once
 * uploaded (a re-upload gets a new filename on conflict), so cache them hard.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return response
}

export const config = {
  matcher: ['/api/media/file/:path*', '/api/models/file/:path*'],
}
