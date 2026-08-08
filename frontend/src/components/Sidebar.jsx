import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('nav')

  // Não mostrar o sidebar nas páginas de login e cadastro
  const hiddenRoutes = ['/login', '/cadastro', '/']
  if (hiddenRoutes.includes(location.pathname)) {
    return null
  }

  const menuItems = [
    { name: t('wallet'), path: '/carteira', icon: 'bi-wallet-fill' },
    { name: t('explore'), path: '/explorar', icon: 'bi-search' },
    { name: t('groups'), path: '/grupos', icon: 'bi-people-fill' },
    { name: t('settings'), path: '/configuracoes', icon: 'bi-gear-wide-connected' }
  ]

  const handleLogout = () => {
    // Aqui você pode adicionar lógica de logout (limpar tokens, etc.)
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-item">
              <button
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <i className={`${item.icon} sidebar-icon`}></i>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="sidebar-footer">
          <div className="sidebar-item">
            <button className="sidebar-logout" onClick={handleLogout}>
              <i className="bi-box-arrow-left sidebar-icon"></i>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
