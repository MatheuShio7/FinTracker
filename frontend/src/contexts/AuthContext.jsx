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
        console.log(`✅ ${data.data.updated_count} preços atualizados no login`)
      } else {
        console.warn('⚠️ Erro ao atualizar preços no login:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar preços no login:', error)
      // Não bloqueia o login se houver erro na atualização de preços
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
        
        // NOVO: Atualizar preços da carteira após login bem-sucedido
        updatePortfolioPricesOnLogin(data.user.id)
        
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
    setUser(null)
    localStorage.removeItem('user_id')
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

