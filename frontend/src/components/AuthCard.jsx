import './AuthCard.css'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { buildApiUrl } from '../config/api'

function AuthCard({ title, type }) {
  const { t } = useTranslation(['auth', 'common'])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaError, setMfaError] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaRetrySeconds, setMfaRetrySeconds] = useState(0)

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('')

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [recoveryAccessToken, setRecoveryAccessToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')
  
  const location = useLocation()
  const navigate = useNavigate()
  const { login, signup, verifyMfaLogin, pendingMfa, cancelMfaLogin } = useAuth()
  
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
      setRecoveryAccessToken(hashParams.get('access_token') || '')
      setIsResetModalOpen(true)
      setResetError('')
      setResetSuccessMessage('')
    }
  }, [type, location.search, location.hash])

  useEffect(() => {
    if (type !== 'login') return
    if (!pendingMfa) return

    setIsMfaModalOpen(true)
    setMfaFactorId(pendingMfa.factorId || null)
  }, [type, pendingMfa])

  useEffect(() => {
    if (!isMfaModalOpen) return

    const lockedUntil = pendingMfa?.lockedUntil || null
    if (!lockedUntil) {
      setMfaRetrySeconds(0)
      return
    }

    const updateCounter = () => {
      const diffSeconds = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
      setMfaRetrySeconds(diffSeconds)
    }

    updateCounter()
    const timer = window.setInterval(updateCounter, 500)
    return () => window.clearInterval(timer)
  }, [isMfaModalOpen, pendingMfa])

  const handleLogin = async () => {
    if (!isLoginFormValid) return
    
    setError('')
    setLoading(true)
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Login bem-sucedido, redireciona para carteira
        setIsMfaModalOpen(false)
        setMfaCode('')
        setMfaFactorId(null)
        setMfaError('')
        navigate('/carteira')
      } else if (result.mfaRequired) {
        setIsMfaModalOpen(true)
        setMfaFactorId(result.factorId || pendingMfa?.factorId || null)
        setMfaError('')
      } else {
        setError(result.message || t('auth:errors.loginFailed'))
      }
    } catch {
      setError(t('auth:errors.server'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMfa = async () => {
    if (!mfaCode.trim()) return
    if (mfaRetrySeconds > 0) return

    setMfaLoading(true)
    setMfaError('')

    try {
      const result = await verifyMfaLogin(mfaCode, mfaFactorId || pendingMfa?.factorId)

      if (result.success) {
        setIsMfaModalOpen(false)
        setMfaCode('')
        setMfaFactorId(null)
        setMfaError('')
        navigate('/carteira')
        return
      }

      if (result.mfaLocked) {
        setMfaRetrySeconds(result.retryAfterSeconds || 0)
      }

      setMfaError(result.message || t('auth:errors.mfaValidate'))
    } catch {
      setMfaError(t('auth:errors.mfaValidateRetry'))
    } finally {
      setMfaLoading(false)
    }
  }

  const closeMfaModal = async () => {
    await cancelMfaLogin()
    setIsMfaModalOpen(false)
    setMfaCode('')
    setMfaFactorId(null)
    setMfaError('')
    setMfaRetrySeconds(0)
  }

  const handleCadastro = async () => {
    if (!isCadastroFormValid) return
    
    setError('')
    
    // Validações adicionais
    if (password.length < 8) {
      setError(t('auth:errors.passwordMin'))
      return
    }
    
    if (password !== confirmPassword) {
      setError(t('auth:errors.passwordMismatch'))
      return
    }
    
    setLoading(true)
    
    try {
      const result = await signup(firstName, lastName, email, password)
      
      if (result.success) {
        // Cadastro bem-sucedido, redireciona para carteira
        navigate('/carteira')
      } else {
        setError(result.message || t('auth:errors.signupFailed'))
      }
    } catch {
      setError(t('auth:errors.server'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError(t('auth:errors.forgotEmailRequired'))
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
        setForgotError(t('auth:errors.forgotSendConfig'))
        return
      }

      setForgotSuccessMessage(t('auth:forgot.success'))
    } catch {
      setForgotError(t('auth:errors.forgotSendRetry'))
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!isResetFormValid) return

    setResetError('')

    if (newPassword.length < 8) {
      setResetError(t('auth:errors.resetPasswordMin'))
      return
    }

    if (newPassword !== confirmNewPassword) {
      setResetError(t('auth:errors.passwordMismatch'))
      return
    }

    setResetLoading(true)

    try {
      if (!recoveryAccessToken) {
        setResetError(t('auth:errors.resetInvalidLink'))
        return
      }

      const response = await fetch(buildApiUrl('api/auth/reset-password/recovery'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: recoveryAccessToken,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setResetError(data.message || t('auth:errors.resetFailed'))
        return
      }

      setResetSuccessMessage(t('auth:reset.success'))
      setNewPassword('')
      setConfirmNewPassword('')
      setRecoveryAccessToken('')

      await supabase.auth.signOut()

      window.setTimeout(() => {
        setIsResetModalOpen(false)
        navigate('/login', { replace: true })
      }, 1200)
    } catch {
      setResetError(t('auth:errors.resetFailedRetry'))
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
    setRecoveryAccessToken('')
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
            <h2 className="auth-modal-title">{t('auth:forgot.title')}</h2>
            <p className="auth-modal-subtitle">{t('auth:forgot.subtitle')}</p>

            {forgotError && <div className="auth-error auth-modal-feedback">{forgotError}</div>}
            {forgotSuccessMessage && <div className="auth-success auth-modal-feedback">{forgotSuccessMessage}</div>}

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-envelope-fill input-icon"></i>
              <input
                type="email"
                placeholder={t('auth:forgot.emailPlaceholder')}
                className="auth-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
              />
            </div>

            <div className="auth-modal-actions">
              <button className="auth-secondary-button" onClick={closeForgotModal} disabled={forgotLoading}>
                {t('common:cancel')}
              </button>
              <button
                className={`auth-button auth-modal-button ${forgotEmail.trim() && !forgotLoading ? 'auth-button-active' : ''}`}
                onClick={handleForgotPassword}
                disabled={!forgotEmail.trim() || forgotLoading}
              >
                {forgotLoading ? t('auth:forgot.sending') : t('auth:forgot.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {type === 'login' && isResetModalOpen && (
        <div className="auth-modal-overlay" onClick={closeResetModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="auth-modal-title">{t('auth:reset.title')}</h2>
            <p className="auth-modal-subtitle">{t('auth:reset.subtitle')}</p>

            {resetError && <div className="auth-error auth-modal-feedback">{resetError}</div>}
            {resetSuccessMessage && <div className="auth-success auth-modal-feedback">{resetSuccessMessage}</div>}

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-shield-lock-fill input-icon"></i>
              <input
                type="password"
                placeholder={t('auth:reset.newPasswordPlaceholder')}
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
                placeholder={t('auth:reset.confirmPlaceholder')}
                className="auth-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={resetLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>

            <div className="auth-modal-actions">
              <button className="auth-secondary-button" onClick={closeResetModal} disabled={resetLoading}>
                {t('common:cancel')}
              </button>
              <button
                className={`auth-button auth-modal-button ${isResetFormValid && !resetLoading ? 'auth-button-active' : ''}`}
                onClick={handleResetPassword}
                disabled={!isResetFormValid || resetLoading}
              >
                {resetLoading ? t('common:saving') : t('auth:reset.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {type === 'login' && isMfaModalOpen && (
        <div className="auth-modal-overlay" onClick={closeMfaModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="auth-modal-title">{t('auth:mfa.title')}</h2>
            <p className="auth-modal-subtitle">
              {t('auth:mfa.subtitle')}
            </p>

            {mfaError && <div className="auth-error auth-modal-feedback">{mfaError}</div>}

            <div className="input-group auth-modal-input-group">
              <i className="bi bi-shield-lock-fill input-icon"></i>
              <input
                type="text"
                placeholder={t('auth:mfa.codePlaceholder')}
                className="auth-input"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={mfaLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyMfa()}
              />
            </div>

            {mfaRetrySeconds > 0 && (
              <p className="auth-mfa-cooldown">
                {t('auth:mfa.cooldown', { seconds: mfaRetrySeconds })}
              </p>
            )}

            <div className="auth-modal-actions">
              <button className="auth-secondary-button" onClick={closeMfaModal} disabled={mfaLoading}>
                {t('common:cancel')}
              </button>
              <button
                className={`auth-button auth-modal-button ${mfaCode.length === 6 && !mfaLoading && mfaRetrySeconds === 0 ? 'auth-button-active' : ''}`}
                onClick={handleVerifyMfa}
                disabled={mfaCode.length !== 6 || mfaLoading || mfaRetrySeconds > 0}
              >
                {mfaLoading ? t('auth:mfa.validating') : t('auth:mfa.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card">
      <div className="auth-card-header">
        <img 
          src="/logo.png" 
          alt={t('auth:logoAlt')} 
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
              placeholder={t('auth:emailPlaceholder')}
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
              placeholder={t('auth:passwordPlaceholder')}
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
            {loading ? t('auth:loginLoading') : t('auth:loginButton')}
          </button>
          
          <div className="auth-links login-links">
            <p className="signup-text">
              {t('auth:noAccount')} <Link to="/cadastro" className="signup-link">{t('auth:signUpLink')}</Link>
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
              {t('auth:forgotPassword')}
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
                placeholder={t('auth:firstNamePlaceholder')}
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
                placeholder={t('auth:lastNamePlaceholder')}
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
              placeholder={t('auth:emailPlaceholder')}
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
              placeholder={t('auth:passwordMinPlaceholder')}
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
              placeholder={t('auth:confirmPasswordPlaceholder')}
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
            {loading ? t('auth:signupLoading') : t('auth:signupButton')}
          </button>

          <div className="auth-links cadastro-links">
            <p className="login-text">
              {t('auth:hasAccount')} <Link to="/login" className="login-link">{t('auth:loginLink')}</Link>
            </p>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default AuthCard
