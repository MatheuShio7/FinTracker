import './AuthCard.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AuthCard({ title, type }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  
  const isLoginFormValid = email.trim() !== '' && password.trim() !== ''
  const isCadastroFormValid = firstName.trim() !== '' && lastName.trim() !== '' && 
                             email.trim() !== '' && password.trim() !== '' && 
                             confirmPassword.trim() !== ''

  const handleLogin = async () => {
    if (!isLoginFormValid) return
    
    setError('')
    setLoading(true)
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Login bem-sucedido, redireciona para carteira
        navigate('/carteira')
      } else {
        setError(result.message || 'Erro ao fazer login')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleCadastro = async () => {
    if (!isCadastroFormValid) return
    
    setError('')
    
    // Validações adicionais
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await signup(firstName, lastName, email, password)
      
      if (result.success) {
        // Cadastro bem-sucedido, redireciona para carteira
        navigate('/carteira')
      } else {
        setError(result.message || 'Erro ao fazer cadastro')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <img 
          src="/logo.png" 
          alt="FinTracker Logo" 
          className="auth-card-logo"
        />
        <h1 className="auth-card-title">{title}</h1>
      </div>
      
      {type === 'login' && (
        <div className="auth-card-content">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="input-group">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input 
              type="email"
              placeholder="Endereço de email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <i className="bi bi-shield-lock-fill input-icon"></i>
            <input 
              type="password"
              placeholder="Senha"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loading}
            />
          </div>
          
          <button 
            className={`auth-button ${isLoginFormValid && !loading ? 'auth-button-active' : ''}`}
            disabled={!isLoginFormValid || loading}
            onClick={handleLogin}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="auth-links login-links">
            <p className="signup-text">
              Ainda não possui conta? <Link to="/cadastro" className="signup-link">Cadastre-se</Link>
            </p>
            
            <a href="#" className="forgot-password-link">
              Esqueceu a senha?
            </a>
          </div>
        </div>
      )}

      {type === 'cadastro' && (
        <div className="auth-card-content">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="name-inputs">
            <div className="input-group half-width">
              <i className="bi bi-person-fill input-icon"></i>
              <input 
                type="text"
                placeholder="Nome"
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="input-group half-width">
              <i className="bi bi-person-fill input-icon"></i>
              <input 
                type="text"
                placeholder="Último nome"
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input 
              type="email"
              placeholder="Endereço de email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <i className="bi bi-shield-lock-fill input-icon"></i>
            <input 
              type="password"
              placeholder="Senha (mínimo 8 caracteres)"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <i className="bi bi-shield-lock-fill input-icon"></i>
            <input 
              type="password"
              placeholder="Confirmar senha"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCadastro()}
              disabled={loading}
            />
          </div>
          
          <button 
            className={`auth-button ${isCadastroFormValid && !loading ? 'auth-button-active' : ''}`}
            disabled={!isCadastroFormValid || loading}
            onClick={handleCadastro}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <div className="auth-links cadastro-links">
            <p className="login-text">
              Já possui conta? <Link to="/login" className="login-link">Entrar</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthCard 