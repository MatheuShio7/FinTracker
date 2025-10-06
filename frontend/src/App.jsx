import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Login from './Login'
import Cadastro from './Cadastro'
import Carteira from './Carteira'
import Explorar from './Explorar'
import Acao from './Acao'
import Configuracoes from './Configuracoes'
import Conteudo from './Conteudo'
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
          <Route path="/carteira" element={<Carteira />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/conteudo" element={<Conteudo />} />
          <Route path="/:ticker" element={<Acao />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App