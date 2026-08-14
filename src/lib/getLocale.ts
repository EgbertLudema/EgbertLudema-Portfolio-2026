import { cookies } from 'next/headers'

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from './locale'

/** Reads the visitor's chosen locale from a cookie set by `LanguageSwitch`
 * (client-side, since it's a plain non-httpOnly cookie). Server Components
 * read it here to fetch Payload content in the right locale; no locale
 * ever appears in the URL. Kept out of locale.ts (which LanguageSwitch, a
 * Client Component, also imports for the `Locale` type/constants) since
 * `next/headers` can't be pulled into a client bundle. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE
}
