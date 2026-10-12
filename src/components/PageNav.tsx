import { getNavLinks } from '@/lib/navigation'
import type { Locale } from '@/lib/locale'
import PageNavClient from './PageNavClient'

/** Server wrapper: fetches the Navigation global's links so every page can
 * keep rendering a plain `<PageNav locale={locale} />`. */
export default async function PageNav({ locale }: { locale: Locale }) {
  const navLinks = await getNavLinks(locale)
  return <PageNavClient locale={locale} navLinks={navLinks} />
}
