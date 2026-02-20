import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PortfolioProvider } from './contexts/PortfolioContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './Login'
import Cadastro from './Cadastro'
import Carteira from './Carteira'
import Explorar from './Explorar'
import Acao from './Acao'
import Configuracoes from './Configuracoes'
import Sidebar from './components/Sidebar'
import './App.css'

function AppContent() {
  const location = useLocation()
  const hiddenRoutes = ['/login', '/cadastro', '/']
  const shouldHideSidebar = hiddenRoutes.includes(location.pathname)

  return (
    <div className="app">
      <Sidebar />
      <div className={`app-content ${shouldHideSidebar ? 'no-sidebar' : ''}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/carteira" element={
            <ProtectedRoute>
              <Carteira />
            </ProtectedRoute>
          } />
          <Route path="/explorar" element={
            <ProtectedRoute>
              <Explorar />
            </ProtectedRoute>
          } />
          <Route path="/:ticker" element={
            <ProtectedRoute>
              <Acao />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <Configuracoes />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PortfolioProvider>
          <AppContent />
        </PortfolioProvider>
      </AuthProvider>
    </Router>
  )
}

export default App