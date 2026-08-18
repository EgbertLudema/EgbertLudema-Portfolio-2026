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
    mimeTypes: ['image/*'],
    // Vercel Blob client uploads bypass the server, so Payload re-fetches the file to sniff its
    // type. That re-fetch can miss (CDN propagation lag right after upload), wrongly rejecting
    // real uploads based on a bad extension-based guess.
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
