/**
 * One-off seed: recreates the original hardcoded homepage list as Payload
 * documents, so the migration to CMS-managed content starts from what was
 * already on the site instead of an empty list.
 *
 * Run with: pnpm run seed
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from './payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'projects', limit: 1 })
  if (existing.totalDocs > 0) {
    payload.logger.info('Projects already exist — skipping seed.')
    process.exit(0)
  }

  const vaultModel = await payload.create({
    collection: 'models',
    data: { alt: 'Vault safe' },
    filePath: path.resolve(dirname, '../public/models/vault.glb'),
  })

  const projects = [
    {
      title: 'Vault',
      slug: 'vault',
      generateSlug: false,
      category: '3D OBJECT · 2026',
      description: 'A dimensional object, modeled and rendered for the web.',
      type: 'model' as const,
      model: vaultModel.id,
      accentColorA: '#efece5',
      accentColorB: '#c9bfe8',
      order: 0,
    },
    {
      title: 'Fieldnotes',
      slug: 'fieldnotes',
      generateSlug: false,
      category: 'VISUAL STUDY · 2026',
      description: 'A quiet study in composition, tone and restraint.',
      type: 'image' as const,
      accentColorA: '#f4f1ec',
      accentColorB: '#d8cfe8',
      order: 1,
    },
    {
      title: 'Greyscale',
      slug: 'greyscale',
      generateSlug: false,
      category: 'TYPE & GRID · 2026',
      description: 'A typographic system built on a strict monochrome grid.',
      type: 'image' as const,
      accentColorA: '#161616',
      accentColorB: '#3a3742',
      order: 2,
    },
    {
      title: 'Paper Trail',
      slug: 'paper-trail',
      generateSlug: false,
      category: 'EDITORIAL · 2026',
      description: 'A print-inspired layout system translated to screen.',
      type: 'image' as const,
      accentColorA: '#fbfbfa',
      accentColorB: '#b7a9e0',
      order: 3,
    },
    {
      title: 'Afterimage',
      slug: 'afterimage',
      generateSlug: false,
      category: 'MOTION STILL · 2026',
      description: 'A single frame pulled from a longer motion piece.',
      type: 'image' as const,
      accentColorA: '#0e0e10',
      accentColorB: '#211d2b',
      order: 4,
    },
  ]

  for (const project of projects) {
    await payload.create({ collection: 'projects', data: project })
  }

  payload.logger.info(`Seeded ${projects.length} projects.`)
  process.exit(0)
}

// Top-level await: `payload run` treats this module's promise resolution as
// "the script is done" and lets the process exit — a floating (unawaited)
// call here let the CLI move on and exit before any of seed()'s async DB
// work actually ran.
try {
  await seed()
} catch (error) {
  console.error(error)
  process.exit(1)
}
