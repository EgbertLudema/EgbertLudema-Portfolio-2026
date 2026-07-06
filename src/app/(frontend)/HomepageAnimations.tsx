'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function HomepageAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      return
    }

    const cleanupCallbacks: Array<() => void> = []

    const context = gsap.context(() => {
      const hero = document.querySelector<HTMLElement>('.hero-section')
      const heroItems = gsap.utils.toArray<HTMLElement>(
        '.hero-section .intro-pill, .hero-section h1, .hero-section p, .hero-actions',
      )

      gsap.set(heroItems, { opacity: 0, y: 22 })
      gsap.to(heroItems, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.11,
      })

      if (hero) {
        const dotShadow = hero.querySelector<HTMLElement>('.hero-dot-shadow')
        const moveDotX = gsap.quickTo(hero, '--hero-dot-x', {
          duration: 0.28,
          ease: 'power3.out',
        })
        const moveDotY = gsap.quickTo(hero, '--hero-dot-y', {
          duration: 0.28,
          ease: 'power3.out',
        })
        const dotPulse = gsap.to(hero, {
          '--hero-dot-scale': 1.025,
          '--hero-dot-size': '1.95px',
          '--hero-dot-fade': '2.22px',
          duration: 0.8,
          ease: 'elastic.out(1, 0.45)',
          paused: true,
          yoyo: true,
          repeat: 1,
        })
        let wasNearDots = false

        const handleHeroPointerMove = (event: PointerEvent) => {
          const bounds = (dotShadow ?? hero).getBoundingClientRect()
          const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
          const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
          const isNear =
            event.clientX >= bounds.left - 140 &&
            event.clientX <= bounds.right + 140 &&
            event.clientY >= bounds.top - 140 &&
            event.clientY <= bounds.bottom + 140

          if (isNear) {
            moveDotX(x)
            moveDotY(y)
            if (!wasNearDots) {
              dotPulse.restart()
            }
          } else {
            moveDotX(140)
            moveDotY(140)
          }

          wasNearDots = isNear
        }

        window.addEventListener('pointermove', handleHeroPointerMove)
        cleanupCallbacks.push(() => {
          window.removeEventListener('pointermove', handleHeroPointerMove)
        })

        gsap.to(hero, {
          '--hero-glow-x': 18,
          '--hero-glow-y': 72,
          '--hero-soft-x': 86,
          '--hero-soft-y': 18,
          duration: 7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })

        ScrollTrigger.create({
          trigger: hero,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            gsap.to(hero, {
              '--hero-tilt': `${(self.progress - 0.5) * 10}deg`,
              duration: 0.35,
              ease: 'power2.out',
            })
          },
        })
      }

      gsap.utils
        .toArray<HTMLElement>('.project-card, .about-section, .tech-section, .contact-section')
        .forEach((element, index) => {
          gsap.from(element, {
            opacity: 0,
            y: 34,
            duration: 0.75,
            delay: index < 3 ? index * 0.05 : 0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 86%',
              once: true,
            },
          })
        })
    })

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup())
      context.revert()
    }
  }, [])

  return null
}
