/**
 * One-off migration for the switch to drafts + the Pages collection:
 *
 * 1. Publishes every project that existed before drafts were enabled.
 *    Adding drafts gives existing rows a non-published `_status`, which
 *    would hide them all from the site. Projects that already have a
 *    version history (i.e. were saved after drafts went live) are left
 *    alone, so re-running this never publishes a real draft.
 * 2. Copies the legacy About / Contact / Projects page globals into
 *    published "about", "contact" and "projects" pages, in both locales.
 *    Pages that already exist are skipped.
 * 3. Fills the Navigation global with links to those three pages, if it's
 *    still empty.
 *
 * Safe to run more than once. Run with: pnpm migrate:pages
 */
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'
import { dictionaries } from '../lib/i18n'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../lib/locale'
import type { Page } from '../payload-types'

type PageData = Omit<Page, 'id' | 'slug' | 'updatedAt' | 'createdAt'>

async function publishExistingProjects(payload: Payload) {
  const { docs } = await payload.find({ collection: 'projects', depth: 0, pagination: false })

  for (const project of docs) {
    if (project._status === 'published') continue

    const { totalDocs } = await payload.findVersions({
      collection: 'projects',
      where: { parent: { equals: project.id } },
      depth: 0,
      limit: 1,
    })
    if (totalDocs > 0) {
      payload.logger.info(`Project "${project.title}" is a draft made after drafts were enabled, leaving it.`)
      continue
    }

    await payload.update({
      collection: 'projects',
      id: project.id,
      // generateSlug: false so publishing can't regenerate an existing slug.
      data: { _status: 'published', generateSlug: false },
      depth: 0,
    })
    payload.logger.info(`Published project "${project.title}".`)
  }
}

// ---------------------------------------------------------------------------
// The old About `content` textarea format -> Lexical rich text

const HEADING_COLORS = ['purple', 'orange', 'yellow', 'green']

function textNode(text: string, headingColor?: string) {
  return {
    type: 'text',
    text,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    version: 1,
    ...(headingColor ? { $: { headingColor } } : {}),
  }
}

const elementBase = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

/** Mirrors how that textarea used to render: blank lines split blocks, "## "
 * and "### " single-line blocks are headings (with an optional trailing
 * "{color}"), all-"- " blocks are bullet lists, the rest are paragraphs
 * with their line breaks kept. */
function plainTextToLexical(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const children = blocks.map((block) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 1) {
      const subheading = lines[0].match(/^###\s+(.+)$/)
      if (subheading) {
        return { ...elementBase, type: 'heading', tag: 'h3', children: [textNode(subheading[1])] }
      }

      const heading = lines[0].match(/^##\s+(.+)$/)
      if (heading) {
        let text = heading[1]
        let color: string | undefined
        const colorMatch = text.match(/\s*\{(\w+)\}\s*$/)
        if (colorMatch) {
          text = text.slice(0, colorMatch.index).trim()
          const candidate = colorMatch[1].toLowerCase()
          color = HEADING_COLORS.includes(candidate) ? candidate : undefined
        }
        return { ...elementBase, type: 'heading', tag: 'h2', children: [textNode(text, color)] }
      }
    }

    if (lines.every((line) => line.startsWith('- '))) {
      return {
        ...elementBase,
        type: 'list',
        listType: 'bullet',
        tag: 'ul',
        start: 1,
        children: lines.map((line, index) => ({
          ...elementBase,
          type: 'listitem',
          value: index + 1,
          children: [textNode(line.replace(/^- /, ''))],
        })),
      }
    }

    return {
      ...elementBase,
      type: 'paragraph',
      textFormat: 0,
      textStyle: '',
      children: lines.flatMap((line, index) =>
        index < lines.length - 1 ? [textNode(line), { type: 'linebreak', version: 1 }] : [textNode(line)],
      ),
    }
  })

  return { root: { ...elementBase, type: 'root', children } }
}

// ---------------------------------------------------------------------------
// Pages

/** Array and block rows aren't localized (only their fields are), so the
 * second locale has to reuse the row ids the first one created, or Payload
 * would treat them as new rows. Copies `id`s over by position. */
function copyRowIds(target: unknown, source: unknown): unknown {
  if (Array.isArray(target)) {
    return target.map((item, index) => copyRowIds(item, Array.isArray(source) ? source[index] : undefined))
  }
  if (target && typeof target === 'object') {
    const sourceObject = source && typeof source === 'object' ? (source as Record<string, unknown>) : {}
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(target)) {
      result[key] = copyRowIds(value, sourceObject[key])
    }
    if (typeof sourceObject.id === 'string' && !('id' in result)) result.id = sourceObject.id
    return result
  }
  return target
}

async function createPage(
  payload: Payload,
  slug: string,
  build: (locale: Locale) => Promise<PageData>,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    draft: true,
    depth: 0,
    limit: 1,
  })
  if (docs[0]) {
    payload.logger.info(`Page "${slug}" already exists, skipping.`)
    return docs[0].id
  }

  const created = await payload.create({
    collection: 'pages',
    locale: DEFAULT_LOCALE,
    data: { ...(await build(DEFAULT_LOCALE)), slug, generateSlug: false, _status: 'published' },
    depth: 0,
  })

  for (const locale of LOCALES.filter((code) => code !== DEFAULT_LOCALE)) {
    const data = copyRowIds(await build(locale), created) as PageData
    await payload.update({
      collection: 'pages',
      id: created.id,
      locale,
      data: { ...data, _status: 'published' },
      depth: 0,
    })
  }

  payload.logger.info(`Created page "${slug}".`)
  return created.id
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return null
}

function relationIds(values: unknown[] | null | undefined): number[] {
  return (values ?? []).map(relationId).filter((id): id is number => id !== null)
}

async function migrate() {
  const payload = await getPayload({ config })

  await publishExistingProjects(payload)

  // Read with fallback on (the default), i.e. exactly what each locale
  // shows on the site today.
  const readAll = async <T,>(read: (locale: Locale) => Promise<T>) =>
    Object.fromEntries(await Promise.all(LOCALES.map(async (locale) => [locale, await read(locale)]))) as Record<
      Locale,
      T
    >
  const about = await readAll((locale) => payload.findGlobal({ slug: 'about-page', locale, depth: 0 }))
  const contact = await readAll((locale) => payload.findGlobal({ slug: 'contact-page', locale, depth: 0 }))
  const projects = await readAll((locale) => payload.findGlobal({ slug: 'skills-page', locale, depth: 0 }))

  // Rows (blocks, array items) are shared between locales, so decide which
  // exist once, from every locale, not per locale.
  const aboutDefault = about[DEFAULT_LOCALE]
  const hasCv = LOCALES.some((locale) => relationId(about[locale].cv) !== null)
  const hasContent = LOCALES.some((locale) => Boolean(about[locale].content))

  const aboutId = await createPage(payload, 'about', async (locale) => {
    const t = dictionaries[locale]
    const source = about[locale]
    const layout: NonNullable<PageData['layout']> = []

    if (hasContent) {
      layout.push({
        blockType: 'content',
        richText: source.content ? plainTextToLexical(source.content) : null,
      })
    }
    if (aboutDefault.experience?.length) {
      layout.push({
        blockType: 'timeline',
        label: t.about.experience,
        items: (source.experience ?? []).map((item) => ({
          logo: relationId(item.logo),
          organization: item.company,
          title: item.role,
          period: item.period,
          description: item.description,
          current: item.current,
          skills: relationIds(item.skills),
        })),
      })
    }
    if (aboutDefault.education?.length) {
      layout.push({
        blockType: 'timeline',
        label: t.about.education,
        items: (source.education ?? []).map((item) => ({
          logo: relationId(item.logo),
          organization: item.institution,
          title: item.title,
          period: item.period,
          current: item.current,
          skills: relationIds(item.skills),
        })),
      })
    }
    layout.push({ blockType: 'skillsList', label: t.common.skills, source: 'all' })

    return {
      title: source.title,
      hero: {
        photo: relationId(source.photo),
        category: source.category,
        description: source.description,
        showContactDetails: false,
        links: hasCv ? [{ label: t.about.downloadCv, type: 'file', file: relationId(source.cv) }] : [],
      },
      layout,
    }
  })

  const contactId = await createPage(payload, 'contact', async (locale) => {
    const source = contact[locale]
    return {
      title: source.title || dictionaries[locale].nav.contact,
      hero: {
        photo: relationId(source.photo),
        category: source.category,
        description: source.description,
        showContactDetails: true,
        links: [],
      },
      layout: [],
    }
  })

  const projectsId = await createPage(payload, 'projects', async (locale) => {
    const source = projects[locale]
    return {
      title: source.title,
      hero: {
        category: source.category,
        description: source.description,
        showContactDetails: false,
        links: [],
      },
      layout: [{ blockType: 'projectsGrid', label: dictionaries[locale].common.projects, showFilter: true }],
    }
  })

  const navigation = await payload.findGlobal({ slug: 'navigation', depth: 0 })
  if (navigation.links?.length) {
    payload.logger.info('Navigation already has links, skipping.')
  } else {
    const navLinks = (locale: Locale) => {
      const t = dictionaries[locale].nav
      return [
        { type: 'page' as const, page: aboutId, label: t.about },
        { type: 'page' as const, page: projectsId, label: t.projects },
        { type: 'page' as const, page: contactId, label: t.contact },
      ]
    }
    const saved = await payload.updateGlobal({
      slug: 'navigation',
      locale: DEFAULT_LOCALE,
      data: { links: navLinks(DEFAULT_LOCALE) },
      depth: 0,
    })
    for (const locale of LOCALES.filter((code) => code !== DEFAULT_LOCALE)) {
      await payload.updateGlobal({
        slug: 'navigation',
        locale,
        data: { links: copyRowIds(navLinks(locale), saved.links) as ReturnType<typeof navLinks> },
        depth: 0,
      })
    }
    payload.logger.info('Filled the Navigation global.')
  }

  payload.logger.info('Done.')
  process.exit(0)
}

// Top-level await: `payload run` exits as soon as this module's import
// resolves, so the migration has to finish before that.
try {
  await migrate()
} catch (error) {
  console.error(error)
  process.exit(1)
}
