'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

import { getDictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/locale'
import styles from './Gallery.module.css'

export type GalleryImage = {
  id: string
  url: string
  alt: string
  caption?: string | null
}

/** Grid of gallery thumbnails that open into a fullscreen lightbox on
 * click, with keyboard (arrows/escape) and on-screen prev/next/close
 * controls once open. The lightbox image scales in on open, and
 * slides/fades in the navigated direction when switching between images.
 * Takes `locale` (not pre-resolved label strings) since functions can't
 * cross the Server -> Client Component prop boundary. */
export default function Gallery({ items, locale }: { items: GalleryImage[]; locale: Locale }) {
  const t = getDictionary(locale).gallery
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  // 0 = just opened (scale in), 1 = navigated next (slide from right), -1 = navigated prev (slide from left).
  const directionRef = useRef(0)

  const openAt = (index: number) => {
    directionRef.current = 0
    setOpenIndex(index)
  }
  const showPrev = () => {
    directionRef.current = -1
    setOpenIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length))
  }
  const showNext = () => {
    directionRef.current = 1
    setOpenIndex((i) => (i === null ? i : (i + 1) % items.length))
  }
  const close = () => setOpenIndex(null)

  useEffect(() => {
    if (openIndex === null) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') showNext()
      if (event.key === 'ArrowLeft') showPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openIndex, items.length])

  useEffect(() => {
    if (openIndex === null) return
    const image = imageRef.current
    if (!image) return

    if (directionRef.current === 0) {
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      }
      gsap.fromTo(
        image,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' },
      )
    } else {
      const fromX = directionRef.current > 0 ? 44 : -44
      gsap.fromTo(image, { opacity: 0, x: fromX }, { opacity: 1, x: 0, duration: 0.32, ease: 'power2.out' })
    }
  }, [openIndex])

  const active = openIndex !== null ? items[openIndex] : null

  return (
    <>
      <div className={styles.gallery}>
        {items.map((item, index) => (
          <figure className={styles.galleryFigure} key={item.id}>
            <button
              type="button"
              className={styles.galleryButton}
              onClick={() => openAt(index)}
              aria-label={t.openImage(index + 1, items.length)}
            >
              <img className={styles.galleryImage} src={item.url} alt={item.alt} />
            </button>
            {item.caption ? <figcaption className={styles.galleryCaption}>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div className={styles.lightbox} ref={overlayRef} onClick={close}>
          <button type="button" className={styles.lightboxClose} onClick={close} aria-label={t.close}>
            &times;
          </button>

          {items.length > 1 ? (
            <>
              <p className={styles.lightboxCount}>
                {String(openIndex! + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </p>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(event) => {
                  event.stopPropagation()
                  showPrev()
                }}
                aria-label={t.previousImage}
              >
                &larr;
              </button>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(event) => {
                  event.stopPropagation()
                  showNext()
                }}
                aria-label={t.nextImage}
              >
                &rarr;
              </button>
            </>
          ) : null}

          <img
            className={styles.lightboxImage}
            src={active.url}
            alt={active.alt}
            ref={imageRef}
            onClick={(event) => event.stopPropagation()}
          />
          {active.caption ? <p className={styles.lightboxCaption}>{active.caption}</p> : null}
        </div>
      ) : null}
    </>
  )
}
