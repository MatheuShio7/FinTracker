import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Cadastro from './Cadastro'
import Carteira from './Carteira'
import Explorar from './Explorar'
import Acao from './Acao'
import Configuracoes from './Configuracoes'
import Conteudo from './Conteudo'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/carteira" element={<Carteira />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/conteudo" element={<Conteudo />} />
          <Route path="/acao" element={<Acao />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App