import { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../config/api'
import { supabase } from '../lib/supabase'

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

  // Busca dados do usuário pelo ID no backend
  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetch(buildApiUrl(`api/auth/user/${userId}`))
      const data = await response.json()

      if (data.status === 'success') {
        return data.user
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  // Fallback: garante perfil no backend caso ainda não exista na tabela users.
  const ensureBackendProfile = async (email, password) => {
    try {
      const response = await fetch(buildApiUrl('api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        return data.user
      }
    } catch (error) {
      console.error('Erro ao sincronizar perfil no backend:', error)
    }

    return null
  }

  // Ao montar, hidrata o estado com a sessão nativa do Supabase.
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      setLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const profile = await fetchUserProfile(session.user.id)

          if (!isMounted) return

          if (profile) {
            setUser(profile)
            localStorage.setItem('user_id', profile.id)
          } else {
            // Compatibilidade temporária com partes ainda legadas.
            setUser({
              id: session.user.id,
              name: '',
              last_name: '',
              email: session.user.email || '',
            })
            localStorage.setItem('user_id', session.user.id)
          }
        } else {
          // Fallback legado durante migração.
          const legacyUserId = localStorage.getItem('user_id')

          if (legacyUserId) {
            const profile = await fetchUserProfile(legacyUserId)

            if (!isMounted) return

            if (profile) {
              setUser(profile)
            } else {
              localStorage.removeItem('user_id')
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error)
        if (isMounted) {
          setUser(null)
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('user_id')
        return
      }

      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id)

        if (!isMounted) return

        if (profile) {
          setUser(profile)
          localStorage.setItem('user_id', profile.id)
        } else {
          setUser({
            id: session.user.id,
            name: '',
            last_name: '',
            email: session.user.email || '',
          })
          localStorage.setItem('user_id', session.user.id)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Função de cadastro
  const signup = async (name, lastName, email, password) => {
    try {
      const response = await fetch(buildApiUrl('api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          last_name: lastName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        // Após cadastro no backend, cria sessão nativa no Supabase.
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          return { success: false, message: signInError.message || 'Cadastro realizado, mas não foi possível iniciar sessão.' }
        }

        const signedUserId = signInData?.user?.id || data.user_id
        const profile = await fetchUserProfile(signedUserId)

        if (profile) {
          setUser(profile)
          localStorage.setItem('user_id', profile.id)
        } else {
          setUser({
            id: signedUserId,
            name: name || '',
            last_name: lastName || '',
            email,
          })
          localStorage.setItem('user_id', signedUserId)
        }
        
        // Limpar cache da carteira (garantir que novo usuário não veja dados antigos)
        const cacheKey = `portfolio_full_${signedUserId}`
        localStorage.removeItem(cacheKey)
        
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  // Atualizar preços da carteira no login
  const updatePortfolioPricesOnLogin = async (userId) => {
    try {
      console.log('🔄 Atualizando preços da carteira no login...')
      
      const response = await fetch(buildApiUrl('api/portfolio/update-prices-login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        console.log(`✅ ${data.data.updated_count} preços da carteira atualizados no login`)
      } else {
        console.warn('⚠️ Erro ao atualizar preços da carteira no login:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar preços da carteira no login:', error)
      // Não bloqueia o login se houver erro na atualização de preços
    }
  }

  // Atualizar preços da watchlist no login
  const updateWatchlistPricesOnLogin = async (userId) => {
    try {
      console.log('🔄 Atualizando preços da watchlist no login...')
      
      const response = await fetch(buildApiUrl('api/watchlist/update-prices-login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        console.log(`✅ ${data.data.updated_count} ações da watchlist atualizadas no login`)
      } else {
        console.warn('⚠️ Erro ao atualizar watchlist no login:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar watchlist no login:', error)
      // Não bloqueia o login se houver erro na atualização
    }
  }

  // Função de login
  const login = async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return { success: false, message: authError.message || 'Erro ao fazer login' }
      }

      const authUserId = authData?.user?.id

      if (!authUserId) {
        return { success: false, message: 'Não foi possível obter o usuário autenticado.' }
      }

      let resolvedUser = await fetchUserProfile(authUserId)

      if (!resolvedUser) {
        resolvedUser = await ensureBackendProfile(email, password)
      }

      if (!resolvedUser) {
        resolvedUser = {
          id: authUserId,
          name: '',
          last_name: '',
          email,
        }
      }

      setUser(resolvedUser)
      localStorage.setItem('user_id', resolvedUser.id)
        
        // IMPORTANTE: Limpar caches ANTES de atualizar preços
        const portfolioCacheKey = `portfolio_full_${resolvedUser.id}`
        const watchlistCacheKey = `watchlist_full_${resolvedUser.id}`
        localStorage.removeItem(portfolioCacheKey)
        localStorage.removeItem(watchlistCacheKey)
        console.log('🗑️ Caches da carteira e watchlist limpos no login')
        
        // Atualizar preços da carteira e watchlist após login bem-sucedido
        // Executar em paralelo para ser mais rápido
        await Promise.all([
          updatePortfolioPricesOnLogin(resolvedUser.id),
          updateWatchlistPricesOnLogin(resolvedUser.id)
        ])
        
      return { success: true, user: resolvedUser }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  // Função de logout
  const logout = async () => {
    // Limpar cache da carteira antes de deslogar
    if (user) {
      localStorage.removeItem(`portfolio_full_${user.id}`)
      localStorage.removeItem(`watchlist_full_${user.id}`)
      console.log('🗑️ Cache da carteira limpo no logout')
    }

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao encerrar sessão no Supabase:', error)
    }

    setUser(null)
    localStorage.removeItem('user_id')
  }

  // Função de atualização de perfil
  const updateProfile = async (name, lastName, email) => {
    if (!user) {
      return { success: false, message: 'Você precisa estar logado' }
    }

    try {
      const response = await fetch(buildApiUrl('api/auth/user/update'), {
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
        // Atualizar o estado do usuário com os novos dados
        setUser(data.user)
        return { success: true, message: data.message, user: data.user }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  // Função de atualização de senha
  const updatePassword = async (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, message: 'Você precisa estar logado' }
    }

    try {
      const response = await fetch(buildApiUrl('api/auth/user/update-password'), {
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
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateProfile,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

