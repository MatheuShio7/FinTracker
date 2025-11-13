import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { usePortfolio } from './contexts/PortfolioContext'
import { buildApiUrl } from './config/api'
import './Explorar.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import SearchBar from './components/SearchBar'
import WatchlistTable from './components/WatchlistTable'

function Explorar() {
  const { user } = useAuth()
  const { cache } = usePortfolio()
  const [watchlistData, setWatchlistData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Buscar dados completos da watchlist
  const fetchWatchlistData = async (forceRefresh = false) => {
    if (!user) {
      setLoading(false)
      return
    }

    // Verificar cache local primeiro (se não for refresh forçado)
    if (!forceRefresh) {
      const cacheKey = `watchlist_full_${user.id}`
      const cachedData = localStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          const now = Date.now()
          const cacheAge = now - parsed.timestamp
          const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
          
          if (cacheAge < CACHE_DURATION) {
            console.log('📦 Usando dados completos da watchlist em cache')
            setWatchlistData(parsed.data)
            setLoading(false)
            return
          } else {
            console.log('⏰ Cache da watchlist completa expirado, buscando servidor...')
          }
        } catch (error) {
          console.warn('Erro ao ler cache da watchlist completa:', error)
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
      
      console.log('🔄 Buscando dados completos da watchlist do servidor...')

      const response = await fetch(
        buildApiUrl(`api/watchlist/full?user_id=${user.id}`)
      )
      const data = await response.json()

      if (data.status === 'success') {
        console.log('📊 Dados da watchlist recebidos:', data.data)
        setWatchlistData(data.data)
        
        // Salvar no cache local
        const cacheKey = `watchlist_full_${user.id}`
        const cacheData = {
          data: data.data,
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log('💾 Dados completos da watchlist salvos em cache')
        
      } else {
        setError(data.message || 'Erro ao buscar watchlist')
      }
    } catch (err) {
      console.error('Erro ao buscar watchlist completa:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados ao montar componente
  useEffect(() => {
    fetchWatchlistData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Recarregar quando o cache da watchlist mudar (ação adicionada/removida)
  useEffect(() => {
    if (cache.timestamp && user) {
      console.log('🔄 Watchlist atualizada, invalidando cache e recarregando...')
      
      // Invalidar cache local da watchlist completa
      const cacheKey = `watchlist_full_${user.id}`
      localStorage.removeItem(cacheKey)
      
      // Forçar refresh dos dados
      fetchWatchlistData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.timestamp])

  return (
    <div className="explorar-page">
      <Logo />
      <PageTitle title="Explorar" />
      <SearchBar />
      <WatchlistTable 
        watchlistData={watchlistData}
        loading={loading}
        error={error}
        onRetry={() => fetchWatchlistData(true)}
      />
    </div>
  )
}

export default Explorar 