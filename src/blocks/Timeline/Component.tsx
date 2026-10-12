import type { Skill, TimelineBlock as TimelineBlockProps } from '@/payload-types'
import styles from '@/app/(frontend)/PageShell.module.css'

function entrySkills(skills: (number | Skill)[] | null | undefined) {
  return (skills ?? []).filter((skill): skill is Skill => typeof skill === 'object')
}

export default function TimelineBlock({ label, items }: TimelineBlockProps) {
  if (!items?.length) return null

  return (
    <section className={styles.listSection}>
      <p className={styles.sectionLabel}>{label}</p>
      <ul className={styles.entryList}>
        {items.map((item) => {
          const logo = typeof item.logo === 'object' ? item.logo : null
          const skills = entrySkills(item.skills)
          return (
            <li
              key={item.id}
              className={`${styles.entryItem} ${item.current ? styles.entryItemActive : ''} ${logo?.url ? styles.entryItemWithLogo : ''}`}
            >
              {logo?.url ? <img className={styles.entryLogo} src={logo.url} alt={logo.alt ?? ''} /> : null}
              <div className={styles.entryBody}>
                <div className={styles.entryHead}>
                  <span className={styles.entryOrg}>{item.organization}</span>
                  {item.period ? <span className={styles.entryPeriod}>{item.period}</span> : null}
                </div>
                <p className={styles.entryTitle}>{item.title}</p>
                {item.description ? <p className={styles.entryDescription}>{item.description}</p> : null}
                {skills.length > 0 ? (
                  <ul className={styles.entrySkills}>
                    {skills.map((skill) => (
                      <li key={skill.id}>
                        <span className={styles.entrySkillChip}>{skill.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
