'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/** Mounted only in draft mode: inside the admin's Live Preview iframe it
 * re-renders the page each time the document autosaves. */
export default function LivePreviewListener() {
  const router = useRouter()
  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={typeof window === 'undefined' ? '' : window.location.origin}
    />
  )
}
