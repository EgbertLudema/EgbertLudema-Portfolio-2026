import React from 'react'

import { HomepageAnimations } from './HomepageAnimations'
import './styles.css'

const projects = [
  {
    description:
      'A private archive product shaped around recall, relationships, and a clear editing experience.',
    meta: 'Product / Next.js / Payload',
    title: 'MemoryVault',
  },
  {
    description:
      'A CMS workflow rebuilt for a content team that needed predictable publishing and fewer admin detours.',
    meta: 'CMS / WordPress / ACF',
    title: 'SimpliCate',
  },
  {
    description:
      'A storefront pass focused on collection rhythm, product hierarchy, and mobile purchase confidence.',
    meta: 'Commerce / Shopify / UX',
    title: 'DICE Label',
  },
]

const services = [
  'Interface design',
  'CMS architecture',
  'Front-end systems',
  'Motion polish',
  'Performance cleanup',
  'Launch support',
]

function Arrow() {
  return (
    <svg aria-hidden="true" className="dot-arrow" viewBox="0 0 18 18">
      <path d="M5 4h9v9" />
      <path d="M14 4 4 14" />
    </svg>
  )
}

function BrandDot() {
  return <span aria-hidden="true" className="brand-dot" />
}

export default function HomePage() {
  return (
    <div className="dot-site">
      <HomepageAnimations />

      <header className="site-nav">
        <a className="brand-link" href="#top" aria-label="Egbert Ludema home">
          <BrandDot />
          <span>Egbert Ludema</span>
        </a>

        <nav aria-label="Primary navigation" className="nav-links">
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="nav-cta" href="mailto:hello@example.com">
          Start a project
          <Arrow />
        </a>
      </header>

      <main>
        <section className="hero-lens" id="top">
          <div className="hero-copy">
            <p className="section-tag">Full-stack developer and designer</p>
            <h1 className="hero-title">
              <span className="text-line">Modern web systems</span>
              <span className="text-line">with one clear</span>
              <span className="text-line">point of focus.</span>
            </h1>
            <p>
              Portfolio sites, CMS platforms, and product interfaces for teams that want sharp
              design, dependable code, and motion that feels intentional.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#work">
                See selected work
                <Arrow />
              </a>
              <a className="secondary-button" href="#services">
                What I do
              </a>
            </div>
          </div>

          <div className="lens-stage" aria-hidden="true">
            <div className="lens-sweep" />
            <div className="lens-ring lens-ring-one" />
            <div className="lens-ring lens-ring-two" />
            <div className="lens-core">
              <span />
            </div>
            <div className="orbit-dot orbit-dot-a" />
            <div className="orbit-dot orbit-dot-b" />
            <div className="orbit-dot orbit-dot-c" />
            <div className="lens-note lens-note-top">Design</div>
            <div className="lens-note lens-note-bottom">Code</div>
          </div>
        </section>

        <section className="statement-section reveal-block">
          <p className="statement-copy">
            <span className="text-line">The dot is the rule:</span>
            <span className="text-line">find the center, remove the noise,</span>
            <span className="text-line">and build outward from the job.</span>
          </p>
        </section>

        <section className="work-section" id="work">
          <div className="section-heading reveal-block">
            <p className="section-tag">Selected work</p>
            <h2>
              <span className="text-line">Clean systems with</span>
              <span className="text-line">enough character.</span>
            </h2>
          </div>

          <div className="work-grid">
            {projects.map((project, index) => (
              <article className="project-tile reveal-block" key={project.title}>
                <div className="project-orb">{String(index + 1).padStart(2, '0')}</div>
                <div className="tile-arc" />
                <p>{project.meta}</p>
                <h3>{project.title}</h3>
                <span>{project.description}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading reveal-block">
            <p className="section-tag">Services</p>
            <h2>
              <span className="text-line">From first concept</span>
              <span className="text-line">to production surface.</span>
            </h2>
          </div>

          <div className="service-cloud reveal-block">
            {services.map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
        </section>

        <section className="contact-panel reveal-block" id="contact">
          <div>
            <p className="section-tag">Contact</p>
            <h2>
              <span className="text-line">Bring the rough version.</span>
              <span className="text-line">I will make it crisp.</span>
            </h2>
          </div>
          <a className="primary-button" href="mailto:hello@example.com">
            hello@example.com
            <Arrow />
          </a>
        </section>
      </main>
    </div>
  )
}
