'use client'

import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function HomepageAnimations() {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanup: Array<() => void> = []

    const context = gsap.context(() => {
      if (reduceMotion) {
        return
      }

      const intro = gsap.timeline({
        defaults: { duration: 0.78, ease: 'power3.out' },
      })

      gsap.set(
        '.hero-title .text-line, .statement-copy .text-line, .section-heading .text-line, .contact-panel .text-line',
        {
          autoAlpha: 0,
          y: 32,
        },
      )
      gsap.set('.lens-ring, .lens-core, .orbit-dot, .lens-note, .lens-sweep', {
        autoAlpha: 0,
        scale: 0.92,
      })

      intro
        .from('.site-nav', { autoAlpha: 0, y: -16 })
        .to(
          '.hero-title .text-line',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.09,
          },
          '<0.08',
        )
        .from(
          '.hero-copy > p:not(.section-tag), .hero-actions',
          {
            autoAlpha: 0,
            y: 22,
            stagger: 0.08,
          },
          '<0.34',
        )
        .from('.lens-stage', { autoAlpha: 0, scale: 0.92, rotation: -3 }, '<0.02')
        .to(
          '.lens-ring, .lens-core, .orbit-dot, .lens-note, .lens-sweep',
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.72,
            stagger: { each: 0.055, from: 'center' },
          },
          '<0.16',
        )

      gsap.to('.lens-ring-one', {
        rotation: 360,
        duration: 18,
        ease: 'none',
        repeat: -1,
      })

      gsap.to('.lens-ring-two', {
        rotation: -360,
        duration: 24,
        ease: 'none',
        repeat: -1,
      })

      gsap.to('.lens-core span', {
        scale: 1.18,
        duration: 1.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.orbit-dot-a', {
        x: 18,
        y: -12,
        duration: 2.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.orbit-dot-b', {
        x: -14,
        y: 14,
        duration: 2.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.orbit-dot-c', {
        x: 10,
        y: 18,
        duration: 2.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.lens-stage', {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-lens',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.9,
        },
      })

      ScrollTrigger.batch('.project-tile, .service-cloud', {
        start: 'top 84%',
        once: true,
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.68,
              ease: 'power3.out',
              stagger: 0.08,
              overwrite: true,
            },
          )
        },
      })

      gsap.utils
        .toArray<HTMLElement>('.statement-copy, .section-heading, .contact-panel')
        .forEach((section) => {
          const lines = section.querySelectorAll<HTMLElement>('.text-line')
          if (!lines.length) return

          gsap.to(lines, {
            autoAlpha: 1,
            y: 0,
            duration: 0.82,
            ease: 'power3.out',
            stagger: 0.075,
            scrollTrigger: {
              trigger: section,
              start: 'top 82%',
              once: true,
            },
          })
        })

      gsap.utils.toArray<HTMLElement>('.project-tile').forEach((tile) => {
        const orb = tile.querySelector('.project-orb')
        const arc = tile.querySelector('.tile-arc')

        gsap.fromTo(
          [orb, arc],
          { autoAlpha: 0, scale: 0.72, rotation: -20 },
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.72,
            ease: 'back.out(1.6)',
            scrollTrigger: {
              trigger: tile,
              start: 'top 84%',
              once: true,
            },
          },
        )

        const handlePointerEnter = () => {
          gsap.to(orb, { scale: 1.12, duration: 0.28, ease: 'power3.out', overwrite: 'auto' })
          gsap.to(arc, {
            rotation: 24,
            scale: 1.08,
            duration: 0.36,
            ease: 'power3.out',
            overwrite: 'auto',
          })
        }
        const handlePointerLeave = () => {
          gsap.to(orb, { scale: 1, duration: 0.28, ease: 'power3.out', overwrite: 'auto' })
          gsap.to(arc, {
            rotation: 0,
            scale: 1,
            duration: 0.36,
            ease: 'power3.out',
            overwrite: 'auto',
          })
        }

        tile.addEventListener('pointerenter', handlePointerEnter)
        tile.addEventListener('pointerleave', handlePointerLeave)
        cleanup.push(() => {
          tile.removeEventListener('pointerenter', handlePointerEnter)
          tile.removeEventListener('pointerleave', handlePointerLeave)
        })
      })
    })

    return () => {
      cleanup.forEach((item) => item())
      context.revert()
    }
  }, [])

  return null
}
