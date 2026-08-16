import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import PageNav from '@/components/PageNav'
import styles from './PageShell.module.css'

export default async function NotFound() {
  const locale = await getLocale()
  const t = getDictionary(locale)

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t.notFound.heading}</h1>
          <p className={styles.description}>{t.notFound.body}</p>
        </header>
      </article>
    </main>
  )
}
