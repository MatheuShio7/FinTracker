import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { usePortfolio } from './contexts/PortfolioContext'
import { buildApiUrl } from './config/api'
import './Carteira.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import PortfolioTable from './components/PortfolioTable'
import PortfolioPieChart from './components/PortfolioPieChart'

function Carteira() {
  const { user } = useAuth()
  const { cache } = usePortfolio()
  const [portfolioData, setPortfolioData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      }
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Buscando dados completos da carteira do servidor...')

      const response = await fetch(
        buildApiUrl(`api/portfolio/full?user_id=${user.id}`)
      )
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

  return (
    <div>
      <Logo />
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