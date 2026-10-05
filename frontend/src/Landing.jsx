import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from './contexts/ThemeContext'
import { normalizeLanguage } from './i18n'
import './Configuracoes.css'
import './Landing.css'

const NAV_ITEMS = [
  { id: 'problema', key: 'problem' },
  { id: 'funcionalidades', key: 'features' },
  { id: 'como-funciona', key: 'howItWorks' },
  { id: 'para-quem', key: 'audience' },
]

const PROBLEM_ITEMS = [
  { key: 'complex', icon: 'bi-layers-fill' },
  { key: 'sheets', icon: 'bi-file-earmark-spreadsheet-fill' },
  { key: 'learn', icon: 'bi-exclamation-triangle-fill' },
]

const FEATURE_ITEMS = [
  { key: 'portfolio', icon: 'bi-pie-chart-fill' },
  { key: 'transactions', icon: 'bi-arrow-left-right' },
  { key: 'watchlist', icon: 'bi-eye-fill' },
  { key: 'groups', icon: 'bi-people-fill' },
  { key: 'ai', icon: 'bi-robot' },
  { key: 'security', icon: 'bi-shield-lock-fill' },
]

const STEP_ITEMS = [
  { key: 'signup', icon: 'bi-person-plus-fill' },
  { key: 'register', icon: 'bi-journal-plus' },
  { key: 'track', icon: 'bi-graph-up-arrow' },
]

const AUDIENCE_ITEMS = [
  { key: 'beginner', icon: 'bi-mortarboard-fill' },
  { key: 'organized', icon: 'bi-bullseye' },
  { key: 'family', icon: 'bi-house-heart-fill' },
  { key: 'multi', icon: 'bi-collection-fill' },
]

const SOLUTION_POINTS = ['overview', 'visual', 'practice']

// Dados puramente ilustrativos para o mockup do dashboard.
const MOCK_POSITIONS = [
  { ticker: 'PETR4', qty: '100', price: 'R$ 38,42', change: '+1,8%', up: true },
  { ticker: 'VALE3', qty: '50', price: 'R$ 61,10', change: '-0,9%', up: false },
  { ticker: 'ITUB4', qty: '200', price: 'R$ 34,75', change: '+0,6%', up: true },
  { ticker: 'WEGE3', qty: '80', price: 'R$ 52,30', change: '+2,3%', up: true },
]

const MOCK_WATCHLIST = [
  { ticker: 'BBAS3', price: 'R$ 27,90', change: '+1,2%', up: true },
  { ticker: 'ABEV3', price: 'R$ 12,85', change: '-0,4%', up: false },
]

const revealDelay = (index, step = 90) => ({ '--delay': `${index * step}ms` })

function Landing() {
  const { t, i18n } = useTranslation(['landing', 'auth', 'settings'])
  const { isDark, setTheme } = useTheme()
  const selectedLanguage = normalizeLanguage(i18n.language)
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef(null)
  const pageRef = useRef(null)

  const currentFlag =
    selectedLanguage === 'en'
      ? '/Flag_of_the_United_States.svg.png'
      : '/Flag_of_Brazil.svg.webp'
  const currentFlagAlt =
    selectedLanguage === 'en' ? t('settings:lang.enAlt') : t('settings:lang.ptAlt')

  // Fecha o menu de idioma ao clicar fora ou pressionar Esc
  useEffect(() => {
    if (!langOpen) return

    const handlePointerDown = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setLangOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [langOpen])

  // Fecha o menu mobile com Esc
  useEffect(() => {
    if (!menuOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  // Sombra no header após rolar a página
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animações de entrada ao rolar (scroll reveal)
  useEffect(() => {
    const root = pageRef.current
    if (!root) return

    const elements = root.querySelectorAll('.lp-reveal')

    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
    setLangOpen(false)
  }

  const goToSection = useCallback((event, id) => {
    const target = document.getElementById(id)
    setMenuOpen(false)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const year = new Date().getFullYear()

  return (
    <div className="landing-page" ref={pageRef}>
      {/* ───────────── Header ───────────── */}
      <header className={`lp-header ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
        <div className="lp-header-inner">
          <a
            href="#topo"
            className="lp-brand"
            onClick={(event) => {
              event.preventDefault()
              setMenuOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="FinTracker"
          >
            <img src="/logo.png" alt="" className="lp-brand-image" />
            <span className="lp-brand-text">FinTracker</span>
          </a>

          <nav className="lp-nav" aria-label={t('landing:nav.mainNav')}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="lp-nav-link"
                onClick={(event) => goToSection(event, item.id)}
              >
                {t(`landing:nav.${item.key}`)}
              </a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <div className="theme-toggle-container">
              <label className="theme-toggle-switch">
                <input
                  type="checkbox"
                  checked={isDark}
                  onChange={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={t('settings:theme')}
                />
                <span className="theme-toggle-slider">
                  <i className="bi bi-sun-fill theme-icon sun-icon"></i>
                  <i className="bi bi-moon-fill theme-icon moon-icon"></i>
                </span>
              </label>
            </div>

            <div className="landing-language" ref={langRef}>
              <button
                type="button"
                className="landing-language-trigger"
                onClick={() => setLangOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={t('settings:language')}
              >
                <img src={currentFlag} alt={currentFlagAlt} className="landing-language-flag" />
                <i
                  className={`bi bi-chevron-down landing-language-chevron ${langOpen ? 'open' : ''}`}
                ></i>
              </button>

              {langOpen && (
                <ul className="landing-language-menu" role="listbox">
                  <li role="option" aria-selected={selectedLanguage === 'pt-BR'}>
                    <button
                      type="button"
                      className={`landing-language-option ${selectedLanguage === 'pt-BR' ? 'selected' : ''}`}
                      onClick={() => changeLanguage('pt-BR')}
                    >
                      <img
                        src="/Flag_of_Brazil.svg.webp"
                        alt={t('settings:lang.ptAlt')}
                        className="landing-language-flag"
                      />
                      <span>{t('settings:lang.ptAlt')}</span>
                    </button>
                  </li>
                  <li role="option" aria-selected={selectedLanguage === 'en'}>
                    <button
                      type="button"
                      className={`landing-language-option ${selectedLanguage === 'en' ? 'selected' : ''}`}
                      onClick={() => changeLanguage('en')}
                    >
                      <img
                        src="/Flag_of_the_United_States.svg.png"
                        alt={t('settings:lang.enAlt')}
                        className="landing-language-flag"
                      />
                      <span>{t('settings:lang.enAlt')}</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <Link to="/login" className="landing-btn landing-btn-login lp-header-login">
              {t('auth:loginLink')}
            </Link>

            <Link to="/cadastro" className="landing-btn landing-btn-signup lp-header-signup">
              {t('auth:signUpLink')}
            </Link>

            <button
              type="button"
              className="lp-menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="lp-mobile-menu"
              aria-label={menuOpen ? t('landing:nav.closeMenu') : t('landing:nav.openMenu')}
            >
              <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
            </button>
          </div>
        </div>

        <div
          id="lp-mobile-menu"
          className={`lp-mobile-menu ${menuOpen ? 'open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <nav className="lp-mobile-nav" aria-label={t('landing:nav.mainNav')}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="lp-mobile-link"
                tabIndex={menuOpen ? 0 : -1}
                onClick={(event) => goToSection(event, item.id)}
              >
                {t(`landing:nav.${item.key}`)}
              </a>
            ))}
          </nav>
          <div className="lp-mobile-actions">
            <Link
              to="/login"
              className="landing-btn landing-btn-login"
              tabIndex={menuOpen ? 0 : -1}
            >
              {t('auth:loginLink')}
            </Link>
            <Link
              to="/cadastro"
              className="landing-btn landing-btn-signup"
              tabIndex={menuOpen ? 0 : -1}
            >
              {t('auth:signUpLink')}
            </Link>
          </div>
        </div>
      </header>

      <main id="topo">
        {/* ───────────── 1. Hero ───────────── */}
        <section className="lp-hero">
          <div className="lp-hero-glow lp-hero-glow-a" aria-hidden="true"></div>
          <div className="lp-hero-glow lp-hero-glow-b" aria-hidden="true"></div>

          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-badge lp-reveal">
                <i className="bi bi-graph-up-arrow"></i>
                {t('landing:hero.badge')}
              </span>

              <h1 className="lp-hero-title lp-reveal" style={revealDelay(1)}>
                {t('landing:hero.titleStart')}{' '}
                <span className="lp-gradient-text">{t('landing:hero.titleHighlight')}</span>
              </h1>

              <p className="lp-hero-subtitle lp-reveal" style={revealDelay(2)}>
                {t('landing:hero.subtitle')}
              </p>

              <div className="lp-hero-actions lp-reveal" style={revealDelay(3)}>
                <Link to="/cadastro" className="lp-btn lp-btn-primary lp-btn-lg">
                  {t('landing:hero.cta')}
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <a
                  href="#como-funciona"
                  className="lp-btn lp-btn-ghost lp-btn-lg"
                  onClick={(event) => goToSection(event, 'como-funciona')}
                >
                  {t('landing:hero.secondary')}
                </a>
              </div>

              <ul className="lp-trust lp-reveal" style={revealDelay(4)}>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  {t('landing:hero.trust.free')}
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  {t('landing:hero.trust.virtual')}
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  {t('landing:hero.trust.mfa')}
                </li>
              </ul>
            </div>

            {/*
              Mockup do dashboard feito 100% em CSS.
              Para usar uma imagem real, substitua o conteúdo de .lp-mockup-window por um
              <img src="/dashboard-preview.png" /> (captura da tela "Carteira", ~1600x1000px).
            */}
            <div className="lp-hero-visual lp-reveal lp-reveal-right" style={revealDelay(2)}>
              <div className="lp-mockup" aria-hidden="true">
                <div className="lp-mockup-window">
                  <div className="lp-mockup-bar">
                    <span className="lp-dot lp-dot-red"></span>
                    <span className="lp-dot lp-dot-yellow"></span>
                    <span className="lp-dot lp-dot-green"></span>
                    <span className="lp-mockup-title">{t('landing:mockup.windowTitle')}</span>
                    <span className="lp-mockup-virtual">
                      <i className="bi bi-mortarboard-fill"></i>
                      {t('landing:mockup.virtualBadge')}
                    </span>
                  </div>

                  <div className="lp-mockup-body">
                    <div className="lp-mock-stats">
                      <div className="lp-mock-stat lp-mock-stat-main">
                        <span className="lp-mock-label">{t('landing:mockup.totalLabel')}</span>
                        <strong className="lp-mock-value">{t('landing:mockup.totalValue')}</strong>
                        <svg
                          className="lp-mock-spark"
                          viewBox="0 0 120 32"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="lpSpark" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f65308" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#f65308" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0 26 L14 22 L28 24 L42 16 L56 19 L70 11 L84 14 L98 6 L120 3 L120 32 L0 32 Z"
                            fill="url(#lpSpark)"
                          />
                          <polyline
                            points="0,26 14,22 28,24 42,16 56,19 70,11 84,14 98,6 120,3"
                            fill="none"
                            stroke="#f65308"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="lp-mock-stat">
                        <span className="lp-mock-label">{t('landing:mockup.returnLabel')}</span>
                        <strong className="lp-mock-value lp-up">
                          {t('landing:mockup.returnValue')}
                        </strong>
                      </div>
                      <div className="lp-mock-stat">
                        <span className="lp-mock-label">{t('landing:mockup.assetsLabel')}</span>
                        <strong className="lp-mock-value">{t('landing:mockup.assetsValue')}</strong>
                      </div>
                    </div>

                    <div className="lp-mock-main">
                      <div className="lp-mock-card lp-mock-allocation">
                        <span className="lp-mock-card-title">
                          {t('landing:mockup.allocationTitle')}
                        </span>
                        <div className="lp-donut">
                          <div className="lp-donut-hole"></div>
                        </div>
                        <ul className="lp-donut-legend">
                          {MOCK_POSITIONS.map((position, index) => (
                            <li key={position.ticker}>
                              <span className={`lp-legend-dot lp-legend-${index}`}></span>
                              {position.ticker}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="lp-mock-card lp-mock-positions">
                        <span className="lp-mock-card-title">
                          {t('landing:mockup.positionsTitle')}
                        </span>
                        <div className="lp-mock-table">
                          <div className="lp-mock-row lp-mock-row-head">
                            <span>{t('landing:mockup.colAsset')}</span>
                            <span>{t('landing:mockup.colQty')}</span>
                            <span>{t('landing:mockup.colPrice')}</span>
                            <span>{t('landing:mockup.colVariation')}</span>
                          </div>
                          {MOCK_POSITIONS.map((position) => (
                            <div className="lp-mock-row" key={position.ticker}>
                              <span className="lp-mock-ticker">{position.ticker}</span>
                              <span>{position.qty}</span>
                              <span>{position.price}</span>
                              <span className={position.up ? 'lp-up' : 'lp-down'}>
                                {position.change}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lp-float lp-float-watchlist">
                  <div className="lp-float-head">
                    <i className="bi bi-eye-fill"></i>
                    <span>{t('landing:mockup.watchlistTitle')}</span>
                  </div>
                  {MOCK_WATCHLIST.map((item) => (
                    <div className="lp-float-row" key={item.ticker}>
                      <strong>{item.ticker}</strong>
                      <span>{item.price}</span>
                      <span className={item.up ? 'lp-chip lp-chip-up' : 'lp-chip lp-chip-down'}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="lp-float lp-float-chat">
                  <div className="lp-float-head">
                    <i className="bi bi-robot"></i>
                    <span>FinTracker IA</span>
                  </div>
                  <p className="lp-chat-q">{t('landing:mockup.chatQuestion')}</p>
                  <p className="lp-chat-a">{t('landing:mockup.chatAnswer')}</p>
                </div>
              </div>
              <p className="lp-mockup-note">{t('landing:mockup.disclaimer')}</p>
            </div>
          </div>
        </section>

        {/* ───────────── 2. O Problema ───────────── */}
        <section id="problema" className="lp-section">
          <div className="lp-container">
            <header className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">{t('landing:problem.eyebrow')}</span>
              <h2 className="lp-section-title">{t('landing:problem.title')}</h2>
              <p className="lp-section-subtitle">{t('landing:problem.subtitle')}</p>
            </header>

            <div className="lp-grid lp-grid-3">
              {PROBLEM_ITEMS.map((item, index) => (
                <article
                  key={item.key}
                  className="lp-card lp-card-problem lp-reveal"
                  style={revealDelay(index)}
                >
                  <div className="lp-icon lp-icon-muted">
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <h3>{t(`landing:problem.items.${item.key}.title`)}</h3>
                  <p>{t(`landing:problem.items.${item.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── 3. A Solução ───────────── */}
        <section id="solucao" className="lp-section lp-section-alt">
          <div className="lp-container lp-solution-grid">
            <div className="lp-solution-copy">
              <div className="lp-reveal">
                <span className="lp-eyebrow">{t('landing:solution.eyebrow')}</span>
                <h2 className="lp-section-title lp-align-left">{t('landing:solution.title')}</h2>
                <p className="lp-section-subtitle lp-align-left">
                  {t('landing:solution.subtitle')}
                </p>
              </div>

              <ul className="lp-points">
                {SOLUTION_POINTS.map((point, index) => (
                  <li key={point} className="lp-reveal" style={revealDelay(index + 1)}>
                    <span className="lp-point-check">
                      <i className="bi bi-check-lg"></i>
                    </span>
                    {t(`landing:solution.points.${point}`)}
                  </li>
                ))}
              </ul>

              <div className="lp-reveal" style={revealDelay(4)}>
                <Link to="/cadastro" className="lp-btn lp-btn-primary">
                  {t('landing:hero.cta')}
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>

            <div className="lp-spectrum lp-reveal lp-reveal-right" style={revealDelay(1)}>
              <div className="lp-spectrum-item lp-spectrum-side">
                <div className="lp-spectrum-icon">
                  <i className="bi bi-file-earmark-spreadsheet"></i>
                </div>
                <h3>{t('landing:solution.spectrum.left.title')}</h3>
                <p>{t('landing:solution.spectrum.left.text')}</p>
              </div>

              <div className="lp-spectrum-item lp-spectrum-center">
                <div className="lp-spectrum-icon">
                  <img src="/logo.png" alt="" />
                </div>
                <h3>{t('landing:solution.spectrum.center.title')}</h3>
                <p>{t('landing:solution.spectrum.center.text')}</p>
              </div>

              <div className="lp-spectrum-item lp-spectrum-side">
                <div className="lp-spectrum-icon">
                  <i className="bi bi-bar-chart-steps"></i>
                </div>
                <h3>{t('landing:solution.spectrum.right.title')}</h3>
                <p>{t('landing:solution.spectrum.right.text')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 4. Funcionalidades ───────────── */}
        <section id="funcionalidades" className="lp-section">
          <div className="lp-container">
            <header className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">{t('landing:features.eyebrow')}</span>
              <h2 className="lp-section-title">{t('landing:features.title')}</h2>
              <p className="lp-section-subtitle">{t('landing:features.subtitle')}</p>
            </header>

            <div className="lp-grid lp-grid-3">
              {FEATURE_ITEMS.map((item, index) => (
                <article
                  key={item.key}
                  className="lp-card lp-card-feature lp-reveal"
                  style={revealDelay(index % 3)}
                >
                  <div className="lp-icon">
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <h3>{t(`landing:features.items.${item.key}.title`)}</h3>
                  <p>{t(`landing:features.items.${item.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── 5. Como Funciona ───────────── */}
        <section id="como-funciona" className="lp-section lp-section-alt">
          <div className="lp-container">
            <header className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">{t('landing:steps.eyebrow')}</span>
              <h2 className="lp-section-title">{t('landing:steps.title')}</h2>
              <p className="lp-section-subtitle">{t('landing:steps.subtitle')}</p>
            </header>

            <ol className="lp-steps">
              {STEP_ITEMS.map((item, index) => (
                <li
                  key={item.key}
                  className="lp-step lp-reveal"
                  style={revealDelay(index, 140)}
                >
                  <div className="lp-step-number">{index + 1}</div>
                  <div className="lp-step-card">
                    <div className="lp-icon">
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <h3>{t(`landing:steps.items.${item.key}.title`)}</h3>
                    <p>{t(`landing:steps.items.${item.key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────────── 6. Para Quem É ───────────── */}
        <section id="para-quem" className="lp-section">
          <div className="lp-container">
            <header className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">{t('landing:audience.eyebrow')}</span>
              <h2 className="lp-section-title">{t('landing:audience.title')}</h2>
              <p className="lp-section-subtitle">{t('landing:audience.subtitle')}</p>
            </header>

            <div className="lp-grid lp-grid-4">
              {AUDIENCE_ITEMS.map((item, index) => (
                <article
                  key={item.key}
                  className="lp-card lp-card-audience lp-reveal"
                  style={revealDelay(index)}
                >
                  <div className="lp-icon lp-icon-round">
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <h3>{t(`landing:audience.items.${item.key}.title`)}</h3>
                  <p>{t(`landing:audience.items.${item.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── 7. CTA Final ───────────── */}
        <section className="lp-section lp-section-cta">
          <div className="lp-container">
            <div className="lp-cta lp-reveal">
              <div className="lp-cta-glow" aria-hidden="true"></div>
              <h2>{t('landing:cta.title')}</h2>
              <p>{t('landing:cta.subtitle')}</p>
              <div className="lp-cta-actions">
                <Link to="/cadastro" className="lp-btn lp-btn-white lp-btn-lg">
                  {t('landing:cta.button')}
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <Link to="/login" className="lp-btn lp-btn-outline-white lp-btn-lg">
                  {t('landing:cta.login')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────── Footer ───────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/logo.png" alt="" className="lp-footer-logo" />
            <span>FinTracker</span>
          </div>
          <p className="lp-footer-copy">
            © {year} FinTracker. {t('landing:footer.rights')}
          </p>
          <p className="lp-footer-disclaimer">{t('landing:footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
