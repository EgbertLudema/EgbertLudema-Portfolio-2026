'use client'

import { useEffect, useState } from 'react'

import styles from './Experience.module.css'

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!now) return <div className={styles.clock} />

  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const time = now.toLocaleTimeString('en-GB')

  return (
    <div className={styles.clock}>
      <span>{date}</span>
      <span className={styles.clockTime}>{time}</span>
    </div>
  )
}
