import '../Landing.css'
import './AuthCard.css'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { buildApiUrl } from '../config/api'
import AuthField from './AuthField'

function AuthCard({ type }) {
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

  // Esc fecha o modal que estiver aberto
  useEffect(() => {
    const hasOpenModal = isForgotModalOpen || isResetModalOpen || isMfaModalOpen
    if (!hasOpenModal) return

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return

      if (isMfaModalOpen) {
        closeMfaModal()
      } else if (isResetModalOpen) {
        closeResetModal()
      } else if (isForgotModalOpen) {
        closeForgotModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
    // Os handlers de fechar só dependem dos estados abaixo e de funções estáveis do contexto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForgotModalOpen, isResetModalOpen, isMfaModalOpen])

  const isLogin = type === 'login'
  const mfaReady = mfaCode.length === 6 && !mfaLoading && mfaRetrySeconds === 0

  const renderAlert = (message, variant = 'error') =>
    message ? (
      <div
        className={`auth-alert auth-alert-${variant}`}
        role={variant === 'error' ? 'alert' : 'status'}
      >
        <i
          className={`bi ${variant === 'error' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}`}
          aria-hidden="true"
        ></i>
        <span>{message}</span>
      </div>
    ) : null

  const renderSpinner = (isLoading) =>
    isLoading ? <span className="auth-spinner" aria-hidden="true"></span> : null

  return (
    <>
      {isLogin && isForgotModalOpen && (
        <div className="auth-modal-overlay" onClick={closeForgotModal}>
          <div
            className="auth-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-icon" aria-hidden="true">
              <i className="bi bi-key-fill"></i>
            </div>
            <h2 className="auth-modal-title" id="forgot-modal-title">{t('auth:forgot.title')}</h2>
            <p className="auth-modal-subtitle">{t('auth:forgot.subtitle')}</p>

            {renderAlert(forgotError, 'error')}
            {renderAlert(forgotSuccessMessage, 'success')}

            <AuthField
              id="forgot-email"
              icon="bi-envelope-fill"
              type="email"
              label={t('auth:forgot.emailPlaceholder')}
              placeholder={t('auth:emailExample')}
              autoComplete="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              disabled={forgotLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
              autoFocus
            />

            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-secondary-button"
                onClick={closeForgotModal}
                disabled={forgotLoading}
              >
                {t('common:cancel')}
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-primary auth-modal-button"
                onClick={handleForgotPassword}
                disabled={!forgotEmail.trim() || forgotLoading}
              >
                {renderSpinner(forgotLoading)}
                {forgotLoading ? t('auth:forgot.sending') : t('auth:forgot.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLogin && isResetModalOpen && (
        <div className="auth-modal-overlay" onClick={closeResetModal}>
          <div
            className="auth-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-icon" aria-hidden="true">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h2 className="auth-modal-title" id="reset-modal-title">{t('auth:reset.title')}</h2>
            <p className="auth-modal-subtitle">{t('auth:reset.subtitle')}</p>

            {renderAlert(resetError, 'error')}
            {renderAlert(resetSuccessMessage, 'success')}

            <AuthField
              id="reset-new-password"
              icon="bi-shield-lock-fill"
              type="password"
              label={t('auth:reset.newPasswordPlaceholder')}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetLoading}
              autoFocus
            />

            <AuthField
              id="reset-confirm-password"
              icon="bi-shield-lock-fill"
              type="password"
              label={t('auth:reset.confirmPlaceholder')}
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={resetLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
            />

            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-secondary-button"
                onClick={closeResetModal}
                disabled={resetLoading}
              >
                {t('common:cancel')}
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-primary auth-modal-button"
                onClick={handleResetPassword}
                disabled={!isResetFormValid || resetLoading}
              >
                {renderSpinner(resetLoading)}
                {resetLoading ? t('common:saving') : t('auth:reset.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLogin && isMfaModalOpen && (
        <div className="auth-modal-overlay" onClick={closeMfaModal}>
          <div
            className="auth-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-icon" aria-hidden="true">
              <i className="bi bi-shield-check"></i>
            </div>
            <h2 className="auth-modal-title" id="mfa-modal-title">{t('auth:mfa.title')}</h2>
            <p className="auth-modal-subtitle">{t('auth:mfa.subtitle')}</p>

            {renderAlert(mfaError, 'error')}

            <AuthField
              id="mfa-code"
              icon="bi-shield-lock-fill"
              type="text"
              label={t('auth:mfa.codePlaceholder')}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={mfaLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyMfa()}
              autoFocus
            />

            {mfaRetrySeconds > 0 && (
              <p className="auth-mfa-cooldown">
                <i className="bi bi-clock-history" aria-hidden="true"></i>
                {t('auth:mfa.cooldown', { seconds: mfaRetrySeconds })}
              </p>
            )}

            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-secondary-button"
                onClick={closeMfaModal}
                disabled={mfaLoading}
              >
                {t('common:cancel')}
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-primary auth-modal-button"
                onClick={handleVerifyMfa}
                disabled={!mfaReady}
              >
                {renderSpinner(mfaLoading)}
                {mfaLoading ? t('auth:mfa.validating') : t('auth:mfa.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="auth-card">
        <header className="auth-card-header">
          <h1 className="auth-card-title">
            {isLogin ? t('auth:loginHeading') : t('auth:signupHeading')}
          </h1>
          <p className="auth-card-subtitle">
            {isLogin ? t('auth:loginSubtitle') : t('auth:signupSubtitle')}
          </p>
        </header>

        {isLogin && (
          <>
            <form
              className="auth-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
            >
              {renderAlert(error, 'error')}

              <AuthField
                id="login-email"
                icon="bi-envelope-fill"
                type="email"
                label={t('auth:emailLabel')}
                placeholder={t('auth:emailExample')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <AuthField
                id="login-password"
                icon="bi-shield-lock-fill"
                type="password"
                label={t('auth:passwordLabel')}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                labelAction={
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotError('')
                      setForgotSuccessMessage('')
                      setIsForgotModalOpen(true)
                    }}
                  >
                    {t('auth:forgotPassword')}
                  </button>
                }
              />

              <button
                type="submit"
                className="lp-btn lp-btn-primary auth-submit"
                disabled={!isLoginFormValid || loading}
              >
                {renderSpinner(loading)}
                {loading ? t('auth:loginLoading') : t('auth:loginButton')}
                {!loading && <i className="bi bi-arrow-right" aria-hidden="true"></i>}
              </button>
            </form>

            <p className="auth-switch">
              {t('auth:noAccount')}{' '}
              <Link to="/cadastro" className="auth-link">{t('auth:signUpLink')}</Link>
            </p>
          </>
        )}

        {!isLogin && (
          <>
            <form
              className="auth-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                handleCadastro()
              }}
            >
              {renderAlert(error, 'error')}

              <div className="auth-row">
                <AuthField
                  id="signup-first-name"
                  icon="bi-person-fill"
                  label={t('auth:firstNameLabel')}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />

                <AuthField
                  id="signup-last-name"
                  icon="bi-person-fill"
                  label={t('auth:lastNameLabel')}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <AuthField
                id="signup-email"
                icon="bi-envelope-fill"
                type="email"
                label={t('auth:emailLabel')}
                placeholder={t('auth:emailExample')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <AuthField
                id="signup-password"
                icon="bi-shield-lock-fill"
                type="password"
                label={t('auth:passwordLabel')}
                placeholder="••••••••"
                hint={t('auth:passwordHint')}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <AuthField
                id="signup-confirm-password"
                icon="bi-shield-lock-fill"
                type="password"
                label={t('auth:confirmPasswordLabel')}
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="submit"
                className="lp-btn lp-btn-primary auth-submit"
                disabled={!isCadastroFormValid || loading}
              >
                {renderSpinner(loading)}
                {loading ? t('auth:signupLoading') : t('auth:signupButton')}
                {!loading && <i className="bi bi-arrow-right" aria-hidden="true"></i>}
              </button>
            </form>

            <p className="auth-switch">
              {t('auth:hasAccount')}{' '}
              <Link to="/login" className="auth-link">{t('auth:loginLink')}</Link>
            </p>
          </>
        )}
      </section>
    </>
  )
}

export default AuthCard
