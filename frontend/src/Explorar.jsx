import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { usePortfolio } from './contexts/PortfolioContext'
import { authFetch } from './lib/authFetch'
import './Explorar.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import SearchBar from './components/SearchBar'
import WatchlistTable from './components/WatchlistTable'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'

function Explorar() {
  const { user } = useAuth()
  const { cache } = usePortfolio()
  const [watchlistData, setWatchlistData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

      const response = await authFetch('api/watchlist/full')
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

  // Função para atualizar preços e dividendos de todas as ações da watchlist
  const handleRefresh = async () => {
    if (!user) return
    
    setIsRefreshing(true)
    
    try {
      console.log('🔄 Atualizando preços de todas as ações da watchlist...')
      
      // Chamar endpoint que atualiza preços de todas as ações da watchlist
      const response = await authFetch('api/watchlist/update-prices-login', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        console.log(`✅ ${data.data.updated_count} preços atualizados com sucesso!`)
        
        // Invalidar cache local
        const cacheKey = `watchlist_full_${user.id}`
        localStorage.removeItem(cacheKey)
        
        // Recarregar dados atualizados
        await fetchWatchlistData(true)
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
    <div className="explorar-page">
      <Logo />
      <PageTitle title="Explorar" />
      <NotificationsButton className="explorar-notifications-button" />
      <ReloadButton 
        onClick={handleRefresh} 
        isLoading={isRefreshing}
        className="explorar-reload-button"
      />
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