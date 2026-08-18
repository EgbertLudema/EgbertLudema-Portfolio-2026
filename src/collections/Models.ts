import type { CollectionConfig } from 'payload'

export const Models: CollectionConfig = {
  slug: 'models',
  labels: {
    singular: '3D Model',
    plural: '3D Models',
  },
  admin: {
    useAsTitle: 'alt',
    description: 'Upload .glb / .gltf files to use as the 3D object in a project.',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'models',
    // No `mimeTypes` allowlist: with Vercel Blob client uploads, Payload validates by
    // re-fetching the file server-side to sniff its type, and separately via a hidden
    // `mimeType` field validator against this same list. Both key off that re-fetch, which
    // can come back empty (CDN propagation lag right after upload) or with a browser-guessed
    // type .glb/.gltf isn't registered for, wrongly rejecting real uploads. Access control
    // (admin-only) is the real gate here, not file-type sniffing.
    allowRestrictedFileTypes: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Short internal name, e.g. "Vault safe"',
      },
    },
  ],
}
