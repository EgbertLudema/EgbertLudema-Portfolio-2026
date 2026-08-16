import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Skill } from '@/payload-types'
import { getDictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/getLocale'
import { renderContent } from '@/lib/renderContent'
import PageNav from '@/components/PageNav'
import styles from '../PageShell.module.css'

export const revalidate = 0

function entrySkills(skills: (number | Skill)[] | null | undefined) {
  return (skills ?? []).filter((skill): skill is Skill => typeof skill === 'object')
}

async function getAboutPage(locale: Awaited<ReturnType<typeof getLocale>>) {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'about-page', locale, depth: 1 })
}

async function getSkills() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'skills', sort: 'title', limit: 100 })
  return docs
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const about = await getAboutPage(locale)
  return {
    title: `Egbert Ludema · ${about.title}`,
    description: about.description,
  }
}

export default async function AboutPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const [about, skills] = await Promise.all([getAboutPage(locale), getSkills()])
  const education = about.education ?? []
  const experience = about.experience ?? []

  return (
    <main className={styles.stage}>
      <PageNav locale={locale} />
      <article className={styles.article}>
        <header className={styles.header}>
          {about.category ? <p className={styles.category}>{about.category}</p> : null}
          <h1 className={styles.title}>{about.title}</h1>
          <p className={styles.description}>{about.description}</p>
        </header>

        {about.content ? <div className={styles.body}>{renderContent(about.content)}</div> : null}

        {experience.length > 0 ? (
          <section className={styles.listSection}>
            <p className={styles.sectionLabel}>{t.about.experience}</p>
            <ul className={styles.entryList}>
              {experience.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.entryItem} ${item.current ? styles.entryItemActive : ''}`}
                >
                  <div className={styles.entryHead}>
                    <span className={styles.entryOrg}>{item.company}</span>
                    {item.period ? <span className={styles.entryPeriod}>{item.period}</span> : null}
                  </div>
                  <p className={styles.entryTitle}>{item.role}</p>
                  {item.description ? <p className={styles.entryDescription}>{item.description}</p> : null}
                  {entrySkills(item.skills).length > 0 ? (
                    <ul className={styles.entrySkills}>
                      {entrySkills(item.skills).map((skill) => (
                        <li key={skill.id}>
                          <span className={styles.entrySkillChip}>{skill.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section className={styles.listSection}>
            <p className={styles.sectionLabel}>{t.about.education}</p>
            <ul className={styles.entryList}>
              {education.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.entryItem} ${item.current ? styles.entryItemActive : ''}`}
                >
                  <div className={styles.entryHead}>
                    <span className={styles.entryOrg}>{item.institution}</span>
                    {item.period ? <span className={styles.entryPeriod}>{item.period}</span> : null}
                  </div>
                  <p className={styles.entryTitle}>{item.title}</p>
                  {entrySkills(item.skills).length > 0 ? (
                    <ul className={styles.entrySkills}>
                      {entrySkills(item.skills).map((skill) => (
                        <li key={skill.id}>
                          <span className={styles.entrySkillChip}>{skill.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {skills.length > 0 ? (
          <section className={styles.listSection}>
            <p className={styles.sectionLabel}>{t.common.skills}</p>
            <ul className={styles.skillList}>
              {skills.map((skill) => (
                <li key={skill.id}>
                  <span className={`${styles.skillChip} ${styles.skillChipStatic}`}>{skill.title}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </main>
  )
}
