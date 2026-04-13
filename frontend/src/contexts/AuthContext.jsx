/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../config/api'
import { supabase } from '../lib/supabase'
import { authFetch, authFetchWithToken } from '../lib/authFetch'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingMfa, setPendingMfa] = useState(null)
  const MFA_PENDING_STORAGE_KEY = 'mfa_login_required'
  const MFA_MAX_ATTEMPTS = 3
  const MFA_LOCK_SECONDS = 30

  const normalizeEmail = (email) => (email || '').trim().toLowerCase()

  const fetchUserProfile = async (userId) => {
    try {
      const response = await authFetch(`api/auth/user/${userId}`)
      const data = await response.json()
      return data.status === 'success' ? data.user : null
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  const fetchUserProfileWithToken = async (userId, accessToken) => {
    try {
      const response = await authFetchWithToken(`api/auth/user/${userId}`, accessToken)
      const data = await response.json()
      return data.status === 'success' ? data.user : null
    } catch (error) {
      console.error('Erro ao buscar usuário com token:', error)
      return null
    }
  }

  const ensureBackendProfile = async (email, password) => {
    try {
      if (!password) return null

      const response = await fetch(buildApiUrl('api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizeEmail(email),
          password,
        }),
      })

      const data = await response.json()
      return data.status === 'success' ? data.user : null
    } catch (error) {
      console.error('Erro ao sincronizar perfil no backend:', error)
      return null
    }
  }

  const getTotpFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    return data?.totp || []
  }

  const getAllUserFactors = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data?.user?.factors || []
  }

  const isMfaStepRequired = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (error) return false
      return data?.nextLevel === 'aal2'
    } catch {
      return false
    }
  }

  const setMfaPendingFlag = () => {
    localStorage.setItem(MFA_PENDING_STORAGE_KEY, '1')
  }

  const clearMfaPendingFlag = () => {
    localStorage.removeItem(MFA_PENDING_STORAGE_KEY)
  }

  const hasMfaPendingFlag = () => localStorage.getItem(MFA_PENDING_STORAGE_KEY) === '1'

  const mapMfaErrorMessage = (message = '') => {
    const lower = message.toLowerCase()

    if (lower.includes('invalid') || lower.includes('otp') || lower.includes('code')) {
      return 'Código inválido. Confira o código no app autenticador e tente novamente.'
    }

    if (lower.includes('expired')) {
      return 'Código expirado. Gere um novo código no app autenticador e tente novamente.'
    }

    if (lower.includes('rate') || lower.includes('too many')) {
      return 'Muitas tentativas em sequência. Aguarde alguns segundos e tente novamente.'
    }

    if (lower.includes('factor')) {
      return 'Fator MFA não encontrado. Tente fazer login novamente.'
    }

    return 'Não foi possível validar o código MFA. Tente novamente.'
  }

  const runPostLoginUpdates = async (userId) => {
    try {
      const portfolioCacheKey = `portfolio_full_${userId}`
      const watchlistCacheKey = `watchlist_full_${userId}`
      localStorage.removeItem(portfolioCacheKey)
      localStorage.removeItem(watchlistCacheKey)
      console.log('🗑️ Caches da carteira e watchlist limpos no login')

      await Promise.all([
        updatePortfolioPricesOnLogin(userId),
        updateWatchlistPricesOnLogin(userId)
      ])
    } catch (error) {
      console.error('Erro ao executar atualizações pós-login:', error)
    }
  }

  const resolveUserProfile = async ({ userId, email, accessToken, passwordForEnsure = '' }) => {
    let resolvedUser = null

    if (accessToken) {
      resolvedUser = await fetchUserProfileWithToken(userId, accessToken)
    } else {
      resolvedUser = await fetchUserProfile(userId)
    }

    if (!resolvedUser && passwordForEnsure) {
      resolvedUser = await ensureBackendProfile(email, passwordForEnsure)
    }

    if (!resolvedUser) {
      resolvedUser = {
        id: userId,
        name: '',
        last_name: '',
        email: email || '',
      }
    }

    return resolvedUser
  }

  const applyAuthenticatedUser = (resolvedUser) => {
    setUser(resolvedUser)
    setPendingMfa(null)
    clearMfaPendingFlag()
    localStorage.setItem('user_id', resolvedUser.id)
  }

  const clearPendingMfa = () => {
    setPendingMfa(null)
    clearMfaPendingFlag()
  }

  const cancelMfaLogin = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignora erro de sessão parcial durante cancelamento de MFA.
    }

    clearPendingMfa()
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      setLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user?.id) {
          setUser(null)
          setPendingMfa(null)
          clearMfaPendingFlag()
          localStorage.removeItem('user_id')
          return
        }

        if (hasMfaPendingFlag()) {
          const factors = await getTotpFactors().catch(() => [])
          if (!isMounted) return

          setUser(null)
          localStorage.removeItem('user_id')
          setPendingMfa({
            email: session.user.email || '',
            factorId: factors[0]?.id || null,
            failedAttempts: 0,
            lockedUntil: null,
          })
          return
        }

        const resolvedUser = await resolveUserProfile({
          userId: session.user.id,
          email: session.user.email || '',
          accessToken: session.access_token,
        })

        if (!isMounted) return
        applyAuthenticatedUser(resolvedUser)
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error)
        if (isMounted) {
          setUser(null)
          setPendingMfa(null)
          localStorage.removeItem('user_id')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setPendingMfa(null)
        localStorage.removeItem('user_id')
        return
      }

      // Evita trabalho em eventos que não mudam contexto de login.
      if (event !== 'SIGNED_IN' && event !== 'USER_UPDATED') {
        return
      }

      if (!session?.user?.id) return

      window.setTimeout(async () => {
        if (!isMounted) return

        if (hasMfaPendingFlag()) {
          const factors = await getTotpFactors().catch(() => [])
          if (!isMounted) return

          setUser(null)
          localStorage.removeItem('user_id')
          setPendingMfa({
            email: session.user.email || '',
            factorId: factors[0]?.id || null,
            failedAttempts: 0,
            lockedUntil: null,
          })
          return
        }

        const resolvedUser = await resolveUserProfile({
          userId: session.user.id,
          email: session.user.email || '',
          accessToken: session.access_token,
        })

        if (!isMounted) return
        applyAuthenticatedUser(resolvedUser)
      }, 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  const signup = async (name, lastName, email, password) => {
    try {
      const normalizedEmail = normalizeEmail(email)

      const response = await fetch(buildApiUrl('api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          last_name: lastName,
          email: normalizedEmail,
          password,
        }),
      })

      const data = await response.json()
      if (data.status !== 'success') {
        return { success: false, message: data.message }
      }

      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        return { success: false, message: signInError.message || 'Cadastro feito, mas sem sessão.' }
      }

      const authUserId = signInData?.user?.id || data.user_id
      const resolvedUser = await resolveUserProfile({
        userId: authUserId,
        email: normalizedEmail,
        accessToken: signInData?.session?.access_token || null,
      })

      applyAuthenticatedUser(resolvedUser)
      await runPostLoginUpdates(resolvedUser.id)

      return { success: true, message: data.message, user: resolvedUser }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  const updatePortfolioPricesOnLogin = async (userId) => {
    try {
      const response = await authFetch('api/portfolio/update-prices-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()
      if (data.status !== 'success') {
        console.warn('⚠️ Erro ao atualizar preços da carteira no login:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar preços da carteira no login:', error)
    }
  }

  const updateWatchlistPricesOnLogin = async (userId) => {
    try {
      const response = await authFetch('api/watchlist/update-prices-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()
      if (data.status !== 'success') {
        console.warn('⚠️ Erro ao atualizar watchlist no login:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar watchlist no login:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const normalizedEmail = normalizeEmail(email)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) {
        if (authError.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, message: 'Confirme seu email antes de fazer login.' }
        }
        return { success: false, message: authError.message || 'Erro ao fazer login' }
      }

      const authUserId = authData?.user?.id
      if (!authUserId) {
        return { success: false, message: 'Não foi possível obter o usuário autenticado.' }
      }

      const requiresMfa = await isMfaStepRequired()
      if (requiresMfa) {
        const factors = await getTotpFactors()
        const primaryFactorId = factors[0]?.id || null

        setMfaPendingFlag()

        setPendingMfa({
          email: authData?.user?.email || normalizedEmail,
          factorId: primaryFactorId,
          failedAttempts: 0,
          lockedUntil: null,
        })

        return {
          success: false,
          mfaRequired: true,
          factorId: primaryFactorId,
          message: 'Digite o código do app autenticador para concluir o login.',
        }
      }

      const resolvedUser = await resolveUserProfile({
        userId: authUserId,
        email: authData?.user?.email || normalizedEmail,
        accessToken: authData?.session?.access_token || null,
        passwordForEnsure: password,
      })

      applyAuthenticatedUser(resolvedUser)
      await runPostLoginUpdates(resolvedUser.id)

      return { success: true, user: resolvedUser }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  const verifyMfaLogin = async (code, explicitFactorId = null) => {
    try {
      const sanitizedCode = (code || '').trim()
      if (!sanitizedCode) {
        return { success: false, message: 'Informe o código de 6 dígitos.' }
      }

      const now = Date.now()
      const lockedUntil = pendingMfa?.lockedUntil || null
      if (lockedUntil && now < lockedUntil) {
        const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntil - now) / 1000))
        return {
          success: false,
          mfaLocked: true,
          retryAfterSeconds,
          message: `Muitas tentativas. Tente novamente em ${retryAfterSeconds}s.`,
        }
      }

      let factorId = explicitFactorId || pendingMfa?.factorId
      if (!factorId) {
        const factors = await getTotpFactors()
        factorId = factors[0]?.id || null
      }

      if (!factorId) {
        return { success: false, message: 'Nenhum fator TOTP encontrado para validação.' }
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: sanitizedCode,
      })

      if (error) {
        const failedAttempts = (pendingMfa?.failedAttempts || 0) + 1
        const nextLockedUntil = failedAttempts >= MFA_MAX_ATTEMPTS
          ? Date.now() + MFA_LOCK_SECONDS * 1000
          : null

        setPendingMfa((prev) => ({
          ...(prev || {}),
          factorId,
          email: prev?.email || '',
          failedAttempts,
          lockedUntil: nextLockedUntil,
        }))

        if (nextLockedUntil) {
          return {
            success: false,
            mfaLocked: true,
            retryAfterSeconds: MFA_LOCK_SECONDS,
            message: `Muitas tentativas inválidas. Aguarde ${MFA_LOCK_SECONDS}s para tentar novamente.`,
          }
        }

        return {
          success: false,
          message: mapMfaErrorMessage(error.message),
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      const authUserId = session?.user?.id

      if (!authUserId) {
        return { success: false, message: 'Sessão não encontrada após validação MFA.' }
      }

      const resolvedUser = await resolveUserProfile({
        userId: authUserId,
        email: session?.user?.email || pendingMfa?.email || '',
        accessToken: session?.access_token || null,
      })

      applyAuthenticatedUser(resolvedUser)
      await runPostLoginUpdates(resolvedUser.id)

      return { success: true, user: resolvedUser }
    } catch (error) {
      console.error('Erro ao validar MFA no login:', error)
      return { success: false, message: 'Erro ao validar código MFA.' }
    }
  }

  const getMfaStatus = async () => {
    try {
      const factors = await getTotpFactors()
      return {
        success: true,
        enabled: factors.length > 0,
        factors,
        primaryFactorId: factors[0]?.id || null,
      }
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao consultar MFA.' }
    }
  }

  const startMfaEnrollment = async () => {
    try {
      const enroll = async () => {
        return supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'FinTracker',
        })
      }

      let { data, error } = await enroll()

      if (error && /friendly name/i.test(error.message || '')) {
        const factors = await getAllUserFactors()
        const pendingFactor = factors.find((factor) => {
          const type = factor.factor_type || factor.factorType
          const status = (factor.status || '').toLowerCase()
          const name = factor.friendly_name || factor.friendlyName || ''
          return type === 'totp' && name === 'FinTracker' && status !== 'verified'
        })

        if (pendingFactor?.id) {
          await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id })
          ;({ data, error } = await enroll())
        }
      }

      if (error) {
        return { success: false, message: error.message || 'Não foi possível iniciar o MFA.' }
      }

      return {
        success: true,
        factorId: data.id,
        qrCode: data?.totp?.qr_code || '',
        secret: data?.totp?.secret || '',
        uri: data?.totp?.uri || '',
      }
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao iniciar MFA.' }
    }
  }

  const confirmMfaEnrollment = async (factorId, code) => {
    try {
      const sanitizedCode = (code || '').trim()
      if (!factorId || !sanitizedCode) {
        return { success: false, message: 'Fator e código são obrigatórios.' }
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: sanitizedCode,
      })

      if (error) {
        return { success: false, message: mapMfaErrorMessage(error.message) }
      }

      return { success: true, message: 'MFA ativado com sucesso!' }
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao confirmar MFA.' }
    }
  }

  const disableMfa = async (factorId) => {
    try {
      if (!factorId) {
        return { success: false, message: 'Fator MFA não informado.' }
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) {
        return { success: false, message: mapMfaErrorMessage(error.message) }
      }

      return { success: true, message: 'MFA desativado com sucesso.' }
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao desativar MFA.' }
    }
  }

  const logout = async () => {
    if (user) {
      localStorage.removeItem(`portfolio_full_${user.id}`)
      localStorage.removeItem(`watchlist_full_${user.id}`)
    }

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao encerrar sessão no Supabase:', error)
    }

    setUser(null)
    setPendingMfa(null)
    clearMfaPendingFlag()
    localStorage.removeItem('user_id')
  }

  const updateProfile = async (name, lastName, email) => {
    if (!user) {
      return { success: false, message: 'Você precisa estar logado' }
    }

    try {
      const response = await authFetch('api/auth/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          name,
          last_name: lastName,
          email,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        setUser(data.user)
        return { success: true, message: data.message, user: data.user }
      }

      return { success: false, message: data.message }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, message: 'Você precisa estar logado' }
    }

    try {
      const response = await authFetch('api/auth/user/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  const value = {
    user,
    loading,
    pendingMfa,
    cancelMfaLogin,
    signup,
    login,
    verifyMfaLogin,
    getMfaStatus,
    startMfaEnrollment,
    confirmMfaEnrollment,
    disableMfa,
    logout,
    updateProfile,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
