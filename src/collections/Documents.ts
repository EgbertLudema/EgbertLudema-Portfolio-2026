import type { CollectionConfig } from 'payload'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: {
    singular: 'Document',
    plural: 'Documents',
  },
  admin: {
    useAsTitle: 'alt',
    description: 'Upload PDFs (e.g. a CV) to link/download elsewhere on the site.',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'documents',
    // No `mimeTypes` allowlist: with Vercel Blob client uploads, Payload validates by
    // re-fetching the file server-side to sniff its type, and separately via a hidden
    // `mimeType` field validator against this same list. Both key off that re-fetch, which
    // can come back empty (CDN propagation lag right after upload), wrongly rejecting real
    // uploads. Access control (admin-only) is the real gate here, not file-type sniffing.
    allowRestrictedFileTypes: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Short internal name, e.g. "CV 2026"',
      },
    },
  ],
}
