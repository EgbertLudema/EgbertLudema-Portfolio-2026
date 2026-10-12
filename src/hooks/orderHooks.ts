import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  PayloadRequest,
} from 'payload'

/** Keeps a collection's numeric `order` field a gap-free 0, 1, 2... list
 * with no duplicates:
 * - A new document goes in at the order it was given (default 0, i.e.
 *   first) and everything from there on moves down one.
 * - Changing a document's order moves it there; the others close up behind
 *   it and make room in front of it.
 * - Deleting a document closes its gap.
 * Out-of-range numbers are clamped (e.g. 99 with 5 items becomes 4). */

// Set on the follow-up updates below so they don't re-trigger the hooks.
const SKIP = 'skipOrderSync'

async function siblings(req: PayloadRequest, collection: CollectionSlug, excludeId?: number | string) {
  const { docs } = await req.payload.find({
    collection,
    where: excludeId === undefined ? {} : { id: { not_equals: excludeId } },
    sort: ['order', 'id'],
    depth: 0,
    pagination: false,
    select: { order: true },
    req,
  })
  return docs as unknown as { id: number | string; order?: number | null }[]
}

async function renumber(
  req: PayloadRequest,
  collection: CollectionSlug,
  items: { id: number | string; order?: number | null }[],
) {
  for (const [index, item] of items.entries()) {
    if (item.order === index) continue
    await req.payload.update({
      collection,
      id: item.id,
      data: { order: index },
      depth: 0,
      context: { [SKIP]: true },
      req,
    })
  }
}

export const clampOrder: CollectionBeforeChangeHook = async ({ collection, context, data, operation, originalDoc, req }) => {
  if (context[SKIP] || typeof data.order !== 'number') return data
  const others = await req.payload.count({
    collection: collection.slug as CollectionSlug,
    where: operation === 'update' && originalDoc ? { id: { not_equals: originalDoc.id } } : {},
    req,
  })
  data.order = Math.min(Math.max(0, Math.round(data.order)), others.totalDocs)
  return data
}

export const syncOrder: CollectionAfterChangeHook = async ({ collection, context, doc, operation, previousDoc, req }) => {
  if (context[SKIP]) return doc
  if (operation === 'update' && previousDoc?.order === doc.order) return doc

  const slug = collection.slug as CollectionSlug
  const items = await siblings(req, slug, doc.id)
  items.splice(doc.order ?? 0, 0, { id: doc.id, order: doc.order })
  await renumber(req, slug, items)
  return doc
}

export const closeOrderGap: CollectionAfterDeleteHook = async ({ collection, context, req }) => {
  if (context[SKIP]) return
  const slug = collection.slug as CollectionSlug
  await renumber(req, slug, await siblings(req, slug))
}
