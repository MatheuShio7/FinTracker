import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeLanguageControls from './ThemeLanguageControls'
import '../Landing.css'
import './AuthLayout.css'

// Dados puramente ilustrativos para o painel visual.
const MOCK_WATCHLIST = [
  { ticker: 'BBAS3', price: 'R$ 27,90', change: '+1,2%', up: true },
  { ticker: 'ABEV3', price: 'R$ 12,85', change: '-0,4%', up: false },
]

const PERKS = ['free', 'virtual', 'mfa']

/**
 * Estrutura das páginas de login e cadastro: header igual ao da landing,
 * painel de apresentação à esquerda (desktop) e o formulário à direita.
 */
function AuthLayout({ variant = 'login', children }) {
  const { t } = useTranslation(['auth', 'landing'])

  return (
    <div className="auth-page">
      <div className="lp-hero-glow lp-hero-glow-a" aria-hidden="true"></div>
      <div className="lp-hero-glow lp-hero-glow-b" aria-hidden="true"></div>

      <header className="auth-topbar">
        <Link to="/" className="lp-brand" aria-label="FinTracker">
          <img src="/logo.png" alt="" className="lp-brand-image" />
          <span className="lp-brand-text">FinTracker</span>
        </Link>

        <div className="auth-topbar-actions">
          <ThemeLanguageControls />
          <Link to="/" className="landing-btn landing-btn-login auth-back">
            <i className="bi bi-arrow-left" aria-hidden="true"></i>
            {t('auth:backHome')}
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <aside className="auth-showcase">
          <span className="lp-badge">
            <i className="bi bi-graph-up-arrow" aria-hidden="true"></i>
            {t(`auth:showcase.${variant}.badge`)}
          </span>

          <h2 className="auth-showcase-title">
            {t(`auth:showcase.${variant}.titleStart`)}{' '}
            <span className="lp-gradient-text">{t(`auth:showcase.${variant}.titleHighlight`)}</span>
          </h2>

          <p className="auth-showcase-subtitle">{t(`auth:showcase.${variant}.subtitle`)}</p>

          <ul className="auth-perks">
            {PERKS.map((perk) => (
              <li key={perk}>
                <span className="lp-point-check">
                  <i className="bi bi-check-lg" aria-hidden="true"></i>
                </span>
                {t(`landing:hero.trust.${perk}`)}
              </li>
            ))}
          </ul>

          <div className="auth-visual" aria-hidden="true">
            <div className="auth-visual-card">
              <div className="auth-visual-head">
                <span className="lp-mock-label">{t('landing:mockup.totalLabel')}</span>
              </div>

              <div className="auth-visual-value">
                <strong>{t('landing:mockup.totalValue')}</strong>
                <span className="lp-chip lp-chip-up">{t('landing:mockup.returnValue')}</span>
              </div>

              <svg className="auth-visual-spark" viewBox="0 0 320 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="authSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f65308" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f65308" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 70 L35 60 L70 66 L105 44 L140 52 L175 30 L210 38 L245 18 L280 24 L320 8 L320 90 L0 90 Z"
                  fill="url(#authSpark)"
                />
                <polyline
                  points="0,70 35,60 70,66 105,44 140,52 175,30 210,38 245,18 280,24 320,8"
                  fill="none"
                  stroke="#f65308"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="auth-float auth-float-watchlist">
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

            <div className="auth-float auth-float-chat">
              <div className="lp-float-head">
                <i className="bi bi-robot"></i>
                <span>FinTracker IA</span>
              </div>
              <p className="lp-chat-q">{t('landing:mockup.chatQuestion')}</p>
              <p className="lp-chat-a">{t('landing:mockup.chatAnswer')}</p>
            </div>
          </div>
        </aside>

        <div className="auth-panel">{children}</div>
      </main>
    </div>
  )
}

export default AuthLayout
