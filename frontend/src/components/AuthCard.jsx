import './AuthCard.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AuthCard({ title, type }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const navigate = useNavigate()
  
  const isLoginFormValid = email.trim() !== '' && password.trim() !== ''
  const isCadastroFormValid = firstName.trim() !== '' && lastName.trim() !== '' && 
                             email.trim() !== '' && password.trim() !== '' && 
                             confirmPassword.trim() !== ''

  const handleLogin = () => {
    if (isLoginFormValid) {
      navigate('/carteira')
    }
  }

  const handleCadastro = () => {
    if (isCadastroFormValid) {
      navigate('/carteira')
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
          <div className="input-group">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input 
              type="email"
              placeholder="Endereço de email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          
          <button 
            className={`auth-button ${isLoginFormValid ? 'auth-button-active' : ''}`}
            disabled={!isLoginFormValid}
            onClick={handleLogin}
          >
            Entrar
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
          <div className="name-inputs">
            <div className="input-group half-width">
              <i className="bi bi-person-fill input-icon"></i>
              <input 
                type="text"
                placeholder="Nome"
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
            />
          </div>
          
          <button 
            className={`auth-button ${isCadastroFormValid ? 'auth-button-active' : ''}`}
            disabled={!isCadastroFormValid}
            onClick={handleCadastro}
          >
            Cadastrar
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