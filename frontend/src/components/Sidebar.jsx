import { useNavigate, useLocation } from 'react-router-dom'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Não mostrar o sidebar nas páginas de login e cadastro
  const hiddenRoutes = ['/login', '/cadastro', '/']
  if (hiddenRoutes.includes(location.pathname)) {
    return null
  }

  const menuItems = [
    { name: 'Carteira', path: '/carteira', icon: 'bi-wallet-fill' },
    { name: 'Explorar', path: '/explorar', icon: 'bi-search' },
    { name: 'Conteúdo', path: '/conteudo', icon: 'bi-book-half' },
    { name: 'Configurações', path: '/configuracoes', icon: 'bi-gear-wide-connected' }
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
              Logout
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar 