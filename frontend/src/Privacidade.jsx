import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeLanguageControls from './components/ThemeLanguageControls'
import './Landing.css'
import './Privacidade.css'

const UPDATED_AT = '10 de novembro de 2026'

function Privacidade() {
  const { t, i18n } = useTranslation(['privacy', 'landing'])
  const isEn = i18n.language?.startsWith('en')
  const updatedLabel = isEn ? 'November 10, 2026' : UPDATED_AT

  return (
    <div className="privacy-page">
      <div className="lp-hero-glow lp-hero-glow-a" aria-hidden="true"></div>
      <div className="lp-hero-glow lp-hero-glow-b" aria-hidden="true"></div>

      <header className="privacy-topbar">
        <Link to="/" className="lp-brand" aria-label="FinTracker">
          <img src="/logo.png" alt="" className="lp-brand-image" />
          <span className="lp-brand-text">FinTracker</span>
        </Link>

        <div className="privacy-topbar-actions">
          <ThemeLanguageControls />
          <Link to="/" className="landing-btn landing-btn-login">
            <i className="bi bi-arrow-left" aria-hidden="true"></i>
            {t('privacy:backHome')}
          </Link>
        </div>
      </header>

      <main className="privacy-main">
        <article className="privacy-article">
          <p className="privacy-eyebrow">{t('privacy:eyebrow')}</p>
          <h1 className="privacy-title">{t('privacy:title')}</h1>
          <p className="privacy-updated">
            {t('privacy:updatedAt', { date: updatedLabel })}
          </p>
          <p className="privacy-intro">{t('privacy:intro')}</p>

          <section>
            <h2>{t('privacy:sections.controller.title')}</h2>
            <p>{t('privacy:sections.controller.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.data.title')}</h2>
            <p>{t('privacy:sections.data.intro')}</p>
            <ul>
              <li>{t('privacy:sections.data.items.account')}</li>
              <li>{t('privacy:sections.data.items.portfolio')}</li>
              <li>{t('privacy:sections.data.items.groups')}</li>
              <li>{t('privacy:sections.data.items.chat')}</li>
              <li>{t('privacy:sections.data.items.prefs')}</li>
              <li>{t('privacy:sections.data.items.tech')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('privacy:sections.purpose.title')}</h2>
            <p>{t('privacy:sections.purpose.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.storage.title')}</h2>
            <p>{t('privacy:sections.storage.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.sharing.title')}</h2>
            <p>{t('privacy:sections.sharing.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.rights.title')}</h2>
            <p>{t('privacy:sections.rights.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.security.title')}</h2>
            <p>{t('privacy:sections.security.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.children.title')}</h2>
            <p>{t('privacy:sections.children.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.changes.title')}</h2>
            <p>{t('privacy:sections.changes.body')}</p>
          </section>

          <section>
            <h2>{t('privacy:sections.contact.title')}</h2>
            <p>{t('privacy:sections.contact.body')}</p>
          </section>
        </article>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/logo.png" alt="" className="lp-footer-logo" />
            <span>FinTracker</span>
          </div>
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} FinTracker. {t('landing:footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Privacidade
