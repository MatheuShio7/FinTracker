import './AuthCard.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function AuthCard({ title, type }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const isFormValid = email.trim() !== '' && password.trim() !== ''

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
            className={`auth-button ${isFormValid ? 'auth-button-active' : ''}`}
            disabled={!isFormValid}
          >
            Entrar
          </button>
          
          <div className="auth-links">
            <p className="signup-text">
              Ainda não possui conta? <Link to="/cadastro" className="signup-link">Cadastre-se</Link>
            </p>
            
            <a href="#" className="forgot-password-link">
              Esqueceu a senha?
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthCard 