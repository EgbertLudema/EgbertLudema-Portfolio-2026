import React from 'react'

import { HomepageAnimations } from './HomepageAnimations'
import './styles.css'

const projects = [
  {
    className: 'placeholder-memory',
    description: 'Web App - Next.js - Tailwind - PostgreSQL',
    title: 'MemoryVault',
  },
  {
    className: 'placeholder-simplicate',
    description: 'WordPress - PHP - ACF - JS',
    title: 'SimpliCate',
  },
  {
    className: 'placeholder-dice',
    description: 'Shopify - Liquid - JS - UI/UX',
    title: 'DICE Label',
  },
]

const techStack = [
  { icon: 'N', label: 'Next.js' },
  { icon: 'R', label: 'React' },
  { icon: 'TS', label: 'TypeScript' },
  { icon: '~', label: 'Tailwind CSS' },
  { icon: 'JS', label: 'Node.js' },
  { icon: 'DB', label: 'PostgreSQL' },
  { icon: 'D', label: 'Docker' },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 16 16">
      <path d="M5 3h8v8" />
      <path d="M13 3 4 12" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="section-label">
      <span />
      {children}
    </p>
  )
}

export default function HomePage() {
  return (
    <div className="site-shell">
      <HomepageAnimations />

      <header className="site-header">
        <a aria-label="Egbert Ludema home" className="brand" href="#">
          EL<span>.</span>
        </a>

        <nav aria-label="Primary navigation" className="main-nav">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#tech">Tech</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="button button-muted header-action" href="#contact">
          Let&apos;s work together
          <ArrowIcon />
        </a>
      </header>

      <div className="site-main">
        <section className="hero-section" id="services">
          <div className="hero-dot-shadow" aria-hidden="true" />
          <div className="intro-pill">Hi, I&apos;m Egbert</div>
          <h1>
            I build digital experiences that are <span>fast, functional and beautifully</span>{' '}
            crafted.
          </h1>
          <p>
            Full-stack developer & designer focused on building websites, webapps and digital
            products.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View my work
              <ArrowIcon />
            </a>
            <a className="about-link" href="#about">
              About me
              <span>+</span>
            </a>
          </div>
        </section>

        <section className="work-section" id="work">
          <div className="section-heading">
            <div>
              <SectionLabel>Featured work</SectionLabel>
              <h2>A selection of recent projects.</h2>
            </div>
            <a className="button button-muted" href="#">
              View all projects
              <ArrowIcon />
            </a>
          </div>

          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.title}>
                <div className={`project-image ${project.className}`}>
                  <div className="browser-bar" />
                  <div className="mock-content">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="project-info">
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>
                  <a aria-label={`${project.title} project`} className="icon-button" href="#">
                    <ArrowIcon />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-copy">
            <SectionLabel>About me</SectionLabel>
            <h2>I&apos;m a developer who loves clean code and simple design.</h2>
            <p>
              I help businesses and startups turn ideas into digital products that are not only
              functional, but a pleasure to use. When I&apos;m not coding, I&apos;m probably
              learning something new, building side projects or drinking way too much coffee.
            </p>
            <a className="button button-muted" href="#">
              More about me
              <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="tech-section" id="tech">
          <SectionLabel>Tech stack</SectionLabel>
          <div className="tech-list">
            {techStack.map((tech) => (
              <div className="tech-pill" key={tech.label}>
                <span>{tech.icon}</span>
                {tech.label}
              </div>
            ))}
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <h2>Have a project in mind?</h2>
            <p>Let&apos;s build something great together.</p>
          </div>
          <a className="button button-primary" href="mailto:hello@example.com">
            Let&apos;s talk
            <ArrowIcon />
          </a>
        </section>
      </div>

      <footer className="site-footer">
        <a aria-label="Egbert Ludema home" className="brand" href="#">
          EL<span>.</span>
        </a>
        <p>&copy; 2026 Egbert Ludema. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">
            LinkedIn
            <ArrowIcon />
          </a>
          <a href="#">
            GitHub
            <ArrowIcon />
          </a>
          <a href="mailto:hello@example.com">
            Email
            <ArrowIcon />
          </a>
        </div>
      </footer>
    </div>
  )
}
