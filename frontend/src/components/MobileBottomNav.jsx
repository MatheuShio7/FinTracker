import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './MobileBottomNav.css'

const MobileBottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation(['nav', 'chat'])

  const hiddenRoutes = ['/login', '/cadastro', '/']
  if (hiddenRoutes.includes(location.pathname)) {
    return null
  }

  const menuItems = [
    { path: '/carteira', icon: 'bi-wallet-fill', label: t('nav:wallet') },
    { path: '/explorar', icon: 'bi-search', label: t('nav:explore') },
    { path: '/grupos', icon: 'bi-people-fill', label: t('nav:groups') },
    { path: '/chat', icon: 'bi-robot', label: t('chat:openAria') },
    { path: '/configuracoes', icon: 'bi-gear-wide-connected', label: t('nav:settings') },
  ]

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação principal">
      {menuItems.map((item) => (
        <button
          key={item.path}
          type="button"
          className={`mobile-bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          aria-current={location.pathname === item.path ? 'page' : undefined}
        >
          <i className={`bi ${item.icon}`} aria-hidden="true"></i>
        </button>
      ))}
    </nav>
  )
}

export default MobileBottomNav
