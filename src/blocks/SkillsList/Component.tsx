import { getPayload } from 'payload'

import config from '@payload-config'
import type { Skill, SkillsListBlock as SkillsListBlockProps } from '@/payload-types'
import styles from '@/app/(frontend)/PageShell.module.css'

async function getSkills({ source, skills }: SkillsListBlockProps): Promise<Skill[]> {
  if (source === 'selected') {
    return (skills ?? []).filter((skill): skill is Skill => typeof skill === 'object')
  }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'skills', sort: 'title', limit: 100 })
  return docs
}

export default async function SkillsListBlock(props: SkillsListBlockProps) {
  const skills = await getSkills(props)
  if (skills.length === 0) return null

  return (
    <section className={styles.listSection}>
      <p className={styles.sectionLabel}>{props.label}</p>
      <ul className={styles.skillList}>
        {skills.map((skill) => (
          <li key={skill.id}>
            <span className={`${styles.skillChip} ${styles.skillChipStatic}`}>{skill.title}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
