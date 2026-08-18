import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
  upload: {
    // No `mimeTypes` allowlist: with Vercel Blob client uploads, Payload validates by
    // re-fetching the file server-side to sniff its type, and separately via a hidden
    // `mimeType` field validator against this same list. Both key off that re-fetch, which
    // can come back empty (CDN propagation lag right after upload), wrongly rejecting real
    // uploads. Access control (admin-only) is the real gate here, not file-type sniffing.
    allowRestrictedFileTypes: true,
    // sharp (wired up in payload.config.ts) downsizes anything larger than
    // this and re-encodes it as WebP on save, so a multi-MB phone photo
    // doesn't get served to visitors at its original size/format.
    resizeOptions: {
      width: 2000,
      height: 2000,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: {
      format: 'webp',
      options: { quality: 80 },
    },
  },
}
