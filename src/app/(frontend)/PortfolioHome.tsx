'use client'

import { useEffect, useState } from 'react'
import { Logo } from './components/Logo'
import { DotNumber } from './components/DotNumber'
import { DotDivider } from './components/DotDivider'
import { nav, hero, about, work, services, contact, footer, type Lang } from './content'

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {open ? (
        <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M2 4.5H14M2 8H14M2 11.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

export default function PortfolioHome() {
  const [lang, setLang] = useState<Lang>('nl')
  const [aboutTab, setAboutTab] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [lang])

  const T = {
    nav: nav[lang],
    hero: hero[lang],
    about: about[lang],
    work: work[lang],
    services: services[lang],
    contact: contact[lang],
    footer: footer[lang],
  }

  const activeTab = T.about.tabs[aboutTab]
  const links: [string, string][] = [
    ['#work', T.nav.work],
    ['#services', T.nav.services],
    ['#about', T.nav.about],
    ['#contact', T.nav.contact],
  ]

  return (
    <>
      <div className="nav">
        <div className="nav__inner">
          <a href="#home" className="nav__brand">
            <Logo />
            Egbert Ludema
          </a>

          <div className="nav__links">
            {links.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </div>

          <div className="nav__right">
            <div className="lang-toggle">
              <button data-active={lang === 'nl'} onClick={() => setLang('nl')}>
                NL
              </button>
              <button data-active={lang === 'en'} onClick={() => setLang('en')}>
                EN
              </button>
            </div>
            <button className="nav__menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              <MenuIcon open={menuOpen} />
            </button>
          </div>

          {menuOpen && (
            <div className="nav__mobile-panel">
              {links.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wrap">
        <section id="home" className="hero">
          <div className="hero__grid">
            <div className="reveal is-visible">
              <div className="eyebrow hero__eyebrow">{T.hero.eyebrow}</div>
              <h1 className="hero__title">{T.hero.title}</h1>
              <p className="hero__subtitle">{T.hero.subtitle}</p>
              <p className="hero__lead">{T.hero.lead}</p>
              <div className="hero__actions">
                <a href="#work" className="btn btn-primary">
                  {T.hero.ctaPrimary}
                </a>
                <a href="#contact" className="btn btn-ghost">
                  {T.hero.ctaSecondary}
                </a>
              </div>
              <div className="hero__stats">
                {T.hero.stats.map((s) => (
                  <div className="hero__stat" key={s.label}>
                    <DotNumber value={s.value} dot={5} gap={2} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero__visual dot-shadow reveal is-visible">
              <div className="hero__visual-surface grad-violet grain" />
              <div className="hero__visual-content">
                <div className="hero__visual-top">
                  <span className="pill hero__visual-badge">{T.hero.eyebrow}</span>
                  <Logo style={{ color: '#fff' }} />
                </div>

                <div className="hero__visual-mid">
                  <DotDivider />
                  <div className="hero__visual-chips">
                    {['Next.js', 'PayloadCMS', 'GSAP', 'Shopify', 'Figma'].map((chip) => (
                      <span className="hero__visual-chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <DotNumber value={T.hero.stats[0].value} dot={9} gap={3} className="hero__visual-number" />
                  <p className="hero__visual-caption">{T.hero.stats[0].label}</p>
                </div>

                <div className="hero__visual-float">
                  <DotDivider />
                  <span>Next.js · PayloadCMS · GSAP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about">
          <div className="section-head reveal">
            <h2>{T.about.heading}</h2>
          </div>

          <div className="about__tabs reveal">
            {T.about.tabs.map((tab, i) => (
              <button key={tab.id} data-active={aboutTab === i} onClick={() => setAboutTab(i)}>
                {tab.label}
              </button>
            ))}
          </div>

          {'values' in activeTab && activeTab.values ? (
            <div className="values-grid reveal">
              {activeTab.values.map((v) => (
                <div className="value-card" key={v.title}>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              ))}
            </div>
          ) : 'timeline' in activeTab && activeTab.timeline ? (
            <div className="about__panel reveal">
              <div>
                {'heading' in activeTab && activeTab.heading && (
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>{activeTab.heading}</h3>
                )}
                {activeTab.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="timeline">
                {activeTab.timeline.map((item) => (
                  <div className="timeline__item" key={item.label}>
                    <div className="timeline__year">{item.year}</div>
                    <div className="timeline__label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : 'skills' in activeTab && activeTab.skills ? (
            <div className="about__panel reveal">
              <div>{activeTab.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}</div>
              <div>
                <span className="eyebrow" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                  {activeTab.skillsLabel}
                </span>
                <div className="work-card__tags" style={{ gap: '0.6rem' }}>
                  {activeTab.skills.map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="about__quote-panel reveal">
              {'quote' in activeTab && activeTab.quote && <p className="about__quote">{activeTab.quote}</p>}
              {'paragraphs' in activeTab && activeTab.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
        </section>

        <section id="work">
          <div className="section-head reveal">
            <h2>{T.work.heading}</h2>
            <p>{T.work.lead}</p>
          </div>

          <div className="work-grid">
            {T.work.items.map((item, i) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="work-card dot-shadow reveal"
              >
                <div className={`work-card__visual grad-${item.gradient} grain`}>
                  <span className="work-card__index">0{i + 1}</span>
                  <span className="work-card__mark">{item.name}</span>
                </div>
                <div className="work-card__body">
                  <span className="work-card__client">{item.client}</span>
                  <h3>{item.name}</h3>
                  <p>{item.blurb}</p>
                  <div className="work-card__tags">
                    {item.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="work-card__link">
                    {lang === 'nl' ? 'Bekijk project' : 'View project'} <ArrowIcon />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="services">
          <div className="section-head reveal">
            <h2>{T.services.heading}</h2>
            <p>{T.services.lead}</p>
          </div>

          <div className="services-grid">
            {T.services.items.map((item, i) => (
              <div className={`service-card reveal ${i === 2 ? 'service-card--wide' : ''}`} key={item.title}>
                <div className="service-card__main">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <div className="service-card__tags">
                    {item.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="service-card__footer">
                  <span className="service-card__price">{item.price}</span>
                  <a href="#contact" className="service-card__cta">
                    {T.services.cta} <ArrowIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact">
          <div className="contact grad-indigo grain reveal">
            <span className="eyebrow">{T.contact.eyebrow}</span>
            <h2 className="contact__heading">{T.contact.heading}</h2>
            <p className="contact__lead">{T.contact.lead}</p>
            <a href={`mailto:${T.contact.email}`} className="btn btn-lime">
              {T.contact.cta} <ArrowIcon />
            </a>
            <p className="contact__email" style={{ marginTop: '1.4rem', opacity: 0.8 }}>
              {T.contact.email}
            </p>
          </div>
        </section>

        <footer className="footer">
          <div>
            <div className="footer__brand">
              <Logo />
              Egbert Ludema
            </div>
            <p className="footer__tagline">{T.footer.tagline}</p>
          </div>
          <p>
            © {new Date().getFullYear()} Egbert Ludema — {T.footer.rights}
          </p>
        </footer>
      </div>
    </>
  )
}
