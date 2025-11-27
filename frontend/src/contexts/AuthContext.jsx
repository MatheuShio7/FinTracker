import { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../config/api'

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

  // Ao montar, verifica se tem usuário logado no localStorage
  useEffect(() => {
    const userId = localStorage.getItem('user_id')
    
    if (userId) {
      // Busca dados do usuário
      fetchUser(userId)
    } else {
      setLoading(false)
    }
  }, [])

  // Busca dados do usuário pelo ID
  const fetchUser = async (userId) => {
    try {
      const response = await fetch(buildApiUrl(`api/auth/user/${userId}`))
      const data = await response.json()
      
      if (data.status === 'success') {
        setUser(data.user)
      } else {
        // Se não encontrar o usuário, limpa o localStorage
        localStorage.removeItem('user_id')
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      localStorage.removeItem('user_id')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

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
        // Após cadastro bem-sucedido, busca dados do usuário
        await fetchUser(data.user_id)
        localStorage.setItem('user_id', data.user_id)
        
        // Limpar cache da carteira (garantir que novo usuário não veja dados antigos)
        const cacheKey = `portfolio_full_${data.user_id}`
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
        setUser(data.user)
        localStorage.setItem('user_id', data.user.id)
        
        // IMPORTANTE: Limpar caches ANTES de atualizar preços
        const portfolioCacheKey = `portfolio_full_${data.user.id}`
        const watchlistCacheKey = `watchlist_full_${data.user.id}`
        localStorage.removeItem(portfolioCacheKey)
        localStorage.removeItem(watchlistCacheKey)
        console.log('🗑️ Caches da carteira e watchlist limpos no login')
        
        // Atualizar preços da carteira e watchlist após login bem-sucedido
        // Executar em paralelo para ser mais rápido
        await Promise.all([
          updatePortfolioPricesOnLogin(data.user.id),
          updateWatchlistPricesOnLogin(data.user.id)
        ])
        
        return { success: true, user: data.user }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, message: 'Erro ao conectar com o servidor' }
    }
  }

  // Função de logout
  const logout = () => {
    // Limpar cache da carteira antes de deslogar
    if (user) {
      const cacheKey = `portfolio_full_${user.id}`
      localStorage.removeItem(cacheKey)
      console.log('🗑️ Cache da carteira limpo no logout')
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

