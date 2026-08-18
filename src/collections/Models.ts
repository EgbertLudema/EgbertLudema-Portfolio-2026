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
    mimeTypes: [
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream',
      '.glb',
      '.gltf',
    ],
    // Vercel Blob client uploads bypass the server, so Payload re-fetches the file to sniff its
    // type. That re-fetch can miss (CDN propagation lag right after upload), and its extension
    // fallback doesn't know .glb/.gltf, so it wrongly rejects real uploads as "text/plain".
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
