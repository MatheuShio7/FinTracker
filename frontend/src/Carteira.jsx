import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { usePortfolio } from './contexts/PortfolioContext'
import { authFetch } from './lib/authFetch'
import './Carteira.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'
import TransactionButton from './components/TransactionButton'
import PortfolioTable from './components/PortfolioTable'
import PortfolioPieChart from './components/PortfolioPieChart'

function Carteira() {
  const { user } = useAuth()
  const { cache } = usePortfolio()
  const [portfolioData, setPortfolioData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Buscar dados completos da carteira
  const fetchPortfolioData = async (forceRefresh = false) => {
    if (!user) {
      setLoading(false)
      return
    }

    // Verificar cache local primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cacheKey = `portfolio_full_${user.id}`
      const cachedData = localStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          const now = Date.now()
          const cacheAge = now - parsed.timestamp
          const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
          
          if (cacheAge < CACHE_DURATION) {
            console.log('📦 Usando dados completos da carteira em cache')
            setPortfolioData(parsed.data)
            setLoading(false)
            return
          } else {
            console.log('⏰ Cache da carteira completa expirado, buscando servidor...')
          }
        } catch (error) {
          console.warn('Erro ao ler cache da carteira completa:', error)
        }
      } else {
        console.log('🆕 Nenhum cache encontrado - buscando dados do servidor...')
      }
    } else {
      console.log('🔄 Refresh forçado - buscando dados do servidor...')
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Buscando dados completos da carteira do servidor...')

      const response = await authFetch('api/portfolio/full')
      const data = await response.json()

      if (data.status === 'success') {
        setPortfolioData(data.data)
        
        // Salvar no cache local
        const cacheKey = `portfolio_full_${user.id}`
        const cacheData = {
          data: data.data,
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log('💾 Dados completos da carteira salvos em cache')
        
      } else {
        setError(data.message || 'Erro ao buscar carteira')
      }
    } catch (err) {
      console.error('Erro ao buscar carteira completa:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados ao montar componente
  useEffect(() => {
    fetchPortfolioData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Recarregar quando o cache do portfolio mudar (ação adicionada/removida)
  useEffect(() => {
    if (cache.timestamp && user) {
      console.log('🔄 Portfolio atualizado, invalidando cache e recarregando...')
      
      // Invalidar cache local da carteira completa
      const cacheKey = `portfolio_full_${user.id}`
      localStorage.removeItem(cacheKey)
      
      // Forçar refresh dos dados
      fetchPortfolioData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.timestamp])

  // Função para atualizar preços de todas as ações da carteira
  const handleRefresh = async () => {
    if (!user) return
    
    setIsRefreshing(true)
    
    try {
      console.log('🔄 Atualizando preços de todas as ações da carteira...')
      
      // Chamar endpoint que atualiza preços de todas as ações
      const response = await authFetch('api/portfolio/update-prices-login', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        console.log(`✅ ${data.data.updated_count} preços atualizados com sucesso!`)
        
        // Invalidar cache local
        const cacheKey = `portfolio_full_${user.id}`
        localStorage.removeItem(cacheKey)
        
        // Recarregar dados atualizados
        await fetchPortfolioData(true)
      } else {
        console.error('❌ Erro ao atualizar preços:', data.message)
        setError(data.message || 'Erro ao atualizar preços')
      }
    } catch (err) {
      console.error('❌ Erro ao conectar com backend:', err)
      setError('Erro ao atualizar preços')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div>
      <Logo />
      <TransactionButton className="carteira-transaction-button" />
      <NotificationsButton className="carteira-notifications-button" />
      <ReloadButton onClick={handleRefresh} isLoading={isRefreshing} />
      <PageTitle title="Carteira" />
      <PortfolioTable 
        portfolioData={portfolioData}
        loading={loading}
        error={error}
        onRetry={() => fetchPortfolioData(true)}
      />
      <PortfolioPieChart portfolio={portfolioData} />
    </div>
  )
}

export default Carteira 