import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PortfolioProvider } from './contexts/PortfolioContext'
import { useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNotifications } from './contexts/NotificationsContext'
import { authFetch } from './lib/authFetch'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './Login'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Cadastro from './Cadastro'
import Carteira from './Carteira'
import Explorar from './Explorar'
import Grupos from './Grupos'
import Acao from './Acao'
import Configuracoes from './Configuracoes'
import Sidebar from './components/Sidebar'
import ChatWidget from './components/ChatWidget'
import './App.css'

function AppContent() {
  const location = useLocation()
  const { user } = useAuth()
  const { loadNotifications, resetNotificationsState } = useNotifications()
  const mfaCheckDoneRef = useRef(false)
  const lastUserIdRef = useRef(null)

  useEffect(() => {
    const currentUserId = user?.id || null

    if (lastUserIdRef.current && lastUserIdRef.current !== currentUserId) {
      resetNotificationsState()
      mfaCheckDoneRef.current = false
    }

    if (!currentUserId) {
      resetNotificationsState()
      mfaCheckDoneRef.current = false
    }

    lastUserIdRef.current = currentUserId
  }, [user, resetNotificationsState])

  useEffect(() => {
    if (!user) return

    const initializeNotifications = async () => {
      await loadNotifications()

      if (mfaCheckDoneRef.current) {
        return
      }

      try {
        const response = await authFetch('api/mfa/status')

        if (!response.ok) {
          console.error('Erro ao verificar status MFA:', response.status)
          return
        }

        const data = await response.json()

        if (data.status === 'success') {
          mfaCheckDoneRef.current = true
          await loadNotifications()
        } else {
          console.error('Erro na resposta MFA:', data.message)
        }
      } catch (error) {
        console.error('Erro ao verificar status de MFA:', error)
      }
    }

    initializeNotifications()
  }, [user, loadNotifications])

  const hiddenRoutes = ['/login', '/cadastro', '/']
  const shouldHideSidebar = hiddenRoutes.includes(location.pathname)
  const chatEnabledRoutes = ['/carteira', '/explorar', '/grupos']
  const shouldShowChatWidget = chatEnabledRoutes.includes(location.pathname)

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
          <Route path="/grupos" element={
            <ProtectedRoute>
              <Grupos />
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

        <ChatWidget enabled={shouldShowChatWidget} />
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationsProvider>
          <PortfolioProvider>
            <AppContent />
          </PortfolioProvider>
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App