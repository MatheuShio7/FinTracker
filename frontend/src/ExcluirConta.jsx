import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeLanguageControls from './components/ThemeLanguageControls'
import { useAuth } from './contexts/AuthContext'
import './Landing.css'
import './Privacidade.css'

function ExcluirConta() {
  const { t } = useTranslation(['deleteAccount', 'landing'])
  const { user } = useAuth()

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
            {t('deleteAccount:backHome')}
          </Link>
        </div>
      </header>

      <main className="privacy-main">
        <article className="privacy-article">
          <p className="privacy-eyebrow">{t('deleteAccount:eyebrow')}</p>
          <h1 className="privacy-title">{t('deleteAccount:title')}</h1>
          <p className="privacy-intro">{t('deleteAccount:intro')}</p>

          <section>
            <h2>{t('deleteAccount:steps.title')}</h2>
            <ol className="privacy-ordered-list">
              <li>{t('deleteAccount:steps.items.login')}</li>
              <li>{t('deleteAccount:steps.items.settings')}</li>
              <li>{t('deleteAccount:steps.items.section')}</li>
              <li>{t('deleteAccount:steps.items.confirm')}</li>
            </ol>
          </section>

          <section>
            <h2>{t('deleteAccount:deleted.title')}</h2>
            <p>{t('deleteAccount:deleted.intro')}</p>
            <ul>
              <li>{t('deleteAccount:deleted.items.profile')}</li>
              <li>{t('deleteAccount:deleted.items.portfolio')}</li>
              <li>{t('deleteAccount:deleted.items.groups')}</li>
              <li>{t('deleteAccount:deleted.items.notifications')}</li>
              <li>{t('deleteAccount:deleted.items.local')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('deleteAccount:retained.title')}</h2>
            <p>{t('deleteAccount:retained.body')}</p>
          </section>

          <section>
            <h2>{t('deleteAccount:period.title')}</h2>
            <p>{t('deleteAccount:period.body')}</p>
          </section>

          <section>
            <h2>{t('deleteAccount:offline.title')}</h2>
            <p>{t('deleteAccount:offline.body')}</p>
          </section>

          <div className="privacy-cta-row">
            {user ? (
              <Link to="/configuracoes" className="lp-btn lp-btn-primary">
                {t('deleteAccount:cta.settings')}
              </Link>
            ) : (
              <Link to="/login" className="lp-btn lp-btn-primary">
                {t('deleteAccount:cta.login')}
              </Link>
            )}
            <Link to="/privacidade" className="lp-btn lp-btn-ghost">
              {t('deleteAccount:cta.privacy')}
            </Link>
          </div>
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

export default ExcluirConta
