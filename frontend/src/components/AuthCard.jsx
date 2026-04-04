import './AuthCard.css'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function AuthCard({ title, type }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('')

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')
  
  const location = useLocation()
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  
  const isLoginFormValid = email.trim() !== '' && password.trim() !== ''
  const isCadastroFormValid = firstName.trim() !== '' && lastName.trim() !== '' && 
                             email.trim() !== '' && password.trim() !== '' && 
                             confirmPassword.trim() !== ''

  const isResetFormValid = newPassword.trim() !== '' && confirmNewPassword.trim() !== ''

  useEffect(() => {
    if (type !== 'login') return

    const queryParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace('#', ''))

    const isRecoveryFlow =
      queryParams.get('reset_password') === '1' &&
      hashParams.get('type') === 'recovery' &&
      Boolean(hashParams.get('access_token'))

    if (isRecoveryFlow) {
      setIsResetModalOpen(true)
      setResetError('')
      setResetSuccessMessage('')
    }
  }, [type, location.search, location.hash])

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
    } catch {
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
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Informe um email válido')
      return
    }

    setForgotError('')
    setForgotSuccessMessage('')
    setForgotLoading(true)

    try {
      const redirectTo = `${window.location.origin}/login?reset_password=1`
      const { error: resetErrorResult } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo,
      })

      if (resetErrorResult) {
        setForgotError('Não foi possível enviar o email agora. Verifique a configuração do Supabase.')
        return
      }

      setForgotSuccessMessage('Se esse email existir, enviamos o link')
    } catch {
      setForgotError('Não foi possível enviar o email agora. Tente novamente em instantes.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!isResetFormValid) return

    setResetError('')

    if (newPassword.length < 8) {
      setResetError('A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('As senhas não coincidem')
      return
    }

    setResetLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setResetError(updateError.message || 'Não foi possível redefinir a senha')
        return
      }

      setResetSuccessMessage('Senha alterada com sucesso. Faça login com sua nova senha.')
      setNewPassword('')
      setConfirmNewPassword('')

      await supabase.auth.signOut()

      window.setTimeout(() => {
        setIsResetModalOpen(false)
        navigate('/login', { replace: true })
      }, 1200)
    } catch {
      setResetError('Não foi possível redefinir a senha. Tente novamente.')
    } finally {
      setResetLoading(false)
    }
  }

  const closeForgotModal = () => {
    setIsForgotModalOpen(false)
    setForgotEmail('')
    setForgotError('')
    setForgotSuccessMessage('')
  }

  const closeResetModal = () => {
    setIsResetModalOpen(false)
    setNewPassword('')
    setConfirmNewPassword('')
    setResetError('')
    setResetSuccessMessage('')
    navigate('/login', { replace: true })
  }

  return (
    <>
      {type === 'login' && isForgotModalOpen && (
        <div className="auth-modal-overlay" onClick={closeForgotModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="auth-modal-title">Recuperar senha</h2>
            <p className="auth-modal-subtitle">Digite o email da sua conta para receber o link de redefinição.</p>

            {forgotError && <div className="auth-error auth-modal-feedback">{forgotError}</div>}
            {forgotSuccessMessage && <div className="auth-success auth-modal-feedback">{forgotSuccessMessage}</div>}

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-envelope-fill input-icon"></i>
              <input
                type="email"
                placeholder="Email da conta"
                className="auth-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
              />
            </div>

            <div className="auth-modal-actions">
              <button className="auth-secondary-button" onClick={closeForgotModal} disabled={forgotLoading}>
                Cancelar
              </button>
              <button
                className={`auth-button auth-modal-button ${forgotEmail.trim() && !forgotLoading ? 'auth-button-active' : ''}`}
                onClick={handleForgotPassword}
                disabled={!forgotEmail.trim() || forgotLoading}
              >
                {forgotLoading ? 'Enviando...' : 'Enviar link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {type === 'login' && isResetModalOpen && (
        <div className="auth-modal-overlay" onClick={closeResetModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="auth-modal-title">Redefinir senha</h2>
            <p className="auth-modal-subtitle">Digite e confirme sua nova senha para finalizar.</p>

            {resetError && <div className="auth-error auth-modal-feedback">{resetError}</div>}
            {resetSuccessMessage && <div className="auth-success auth-modal-feedback">{resetSuccessMessage}</div>}

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-shield-lock-fill input-icon"></i>
              <input
                type="password"
                placeholder="Nova senha (mínimo 8 caracteres)"
                className="auth-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetLoading}
              />
            </div>

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-shield-lock-fill input-icon"></i>
              <input
                type="password"
                placeholder="Confirmar nova senha"
                className="auth-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={resetLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>

            <div className="auth-modal-actions">
              <button className="auth-secondary-button" onClick={closeResetModal} disabled={resetLoading}>
                Cancelar
              </button>
              <button
                className={`auth-button auth-modal-button ${isResetFormValid && !resetLoading ? 'auth-button-active' : ''}`}
                onClick={handleResetPassword}
                disabled={!isResetFormValid || resetLoading}
              >
                {resetLoading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            
            <a
              href="#"
              className="forgot-password-link"
              onClick={(e) => {
                e.preventDefault()
                setForgotEmail(email)
                setForgotError('')
                setForgotSuccessMessage('')
                setIsForgotModalOpen(true)
              }}
            >
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
    </>
  )
}

export default AuthCard 