import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { buildApiUrl } from './config/api'
import { supabase } from './lib/supabase'
import { usePortfolio } from './contexts/PortfolioContext'
import './Acao.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import PageSubtitle from './components/PageSubtitle'
import BackNavigation from './components/BackNavigation'
import ReloadButton from './components/ReloadButton'
import PriceChart from './components/PriceChart'
import DividendsChart from './components/DividendsChart'
import StockEditor from './components/StockEditor'

function Acao() {
  const { ticker } = useParams()
  const location = useLocation()
  const { isInPortfolio, invalidatePortfolioFullCache } = usePortfolio()
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [stockData, setStockData] = useState(null) // Dados do backend (preços e dividendos)
  const [backendError, setBackendError] = useState(null) // Erros do backend
  const [selectedRange, setSelectedRange] = useState('3m') // Range de preços selecionado
  const [chartLoading, setChartLoading] = useState(false) // Loading específico do chart
  const [isRefreshing, setIsRefreshing] = useState(false) // Loading do botão de reload
  
  // Ref para rastrear o ticker anterior (inicializa com null para detectar primeiro carregamento)
  const previousTickerRef = useRef(null)
  
  // Captura de onde o usuário veio (padrão: Explorar)
  const from = location.state?.from || 'Explorar'

  useEffect(() => {
    const fetchStockData = async () => {
      if (!ticker) return

      // Detectar se é mudança de ticker (carregamento inicial) ou apenas mudança de range
      const isTickerChange = previousTickerRef.current !== ticker
      
      if (isTickerChange) {
        // Carregamento inicial: mostrar loading geral
        setIsLoading(true)
        previousTickerRef.current = ticker
        setSelectedRange('3m') // Reset do range ao mudar de ação
      }
      
      try {
        // =====================================================================
        // BUSCA 1: Company Name do Supabase (apenas se mudou o ticker)
        // =====================================================================
        if (isTickerChange) {
          const { data, error } = await supabase
            .from('stocks')
            .select('company_name')
            .eq('ticker', ticker)
            .single()

          if (error) {
            console.error('Erro ao buscar dados da ação:', error)
            setCompanyName('Empresa não encontrada')
          } else if (data) {
            setCompanyName(data.company_name)
          }
        }

        // =====================================================================
        // BUSCA 2: Preços e Dividendos do Backend Flask
        // =====================================================================
        try {
          console.log(`🔄 Buscando dados de ${ticker} do backend...`)
          
          // NOVO: Só força atualização no primeiro carregamento (quando muda o ticker)
          // Ao trocar período, apenas filtra dados do cache
          const forceUpdate = isTickerChange
          console.log(`⚙️ force_update=${forceUpdate} (isTickerChange=${isTickerChange})`)
          
          const response = await fetch(
            buildApiUrl(`api/stocks/${ticker}/view?range=${selectedRange}&force_update=${forceUpdate}`),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          const result = await response.json()

          if (response.ok && result.status === 'success') {
            // Sucesso - Salvar dados
            setStockData(result.data)
            setBackendError(null)
            
            // Logs para debug
            console.log(`✅ Dados recebidos com sucesso!`)
            console.log(`Preços recebidos: ${result.data.prices.length}`)
            console.log(`Dividendos recebidos: ${result.data.dividends.length}`)
            console.log(`Preços atualizados: ${result.data.prices_updated}`)
            console.log(`Dividendos atualizados: ${result.data.dividends_updated}`)
            console.log(`Dados completos:`, result.data)
            
            // Se os preços foram atualizados E a ação está na carteira, invalidar cache
            if (result.data.prices_updated && isInPortfolio(ticker)) {
              console.log(`💰 Preços atualizados para ${ticker} que está em carteira - invalidando cache`)
              invalidatePortfolioFullCache()
            }
          } else {
            // Erro retornado pela API
            if (response.status === 404) {
              console.error('❌ Ação não encontrada no backend')
              setBackendError('Ação não encontrada no backend')
            } else {
              console.error(`❌ Erro ao buscar dados: ${result.message}`)
              setBackendError(result.message || 'Erro ao buscar dados')
            }
            setStockData(null)
          }
        } catch (fetchError) {
          // Erro de conexão
          console.error('❌ Erro ao conectar com backend:', fetchError)
          setBackendError('Erro ao conectar com backend')
          setStockData(null)
        }

      } catch (error) {
        console.error('Erro na busca:', error)
        if (isTickerChange) {
          setCompanyName('Erro ao carregar')
        }
      } finally {
        // Remove loading apropriado
        if (isTickerChange) {
          setIsLoading(false)
        }
        setChartLoading(false)
      }
    }

    fetchStockData()
  }, [ticker, selectedRange])

  // Função para mudar o range e recarregar os dados
  const handleRangeChange = async (newRange) => {
    if (newRange === selectedRange) return // Não recarregar se já é o mesmo range
    
    setChartLoading(true)
    setSelectedRange(newRange)
  }

  // Função para forçar atualização de preço atual e dividendos
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      console.log(`🔄 Iniciando atualização forçada de ${ticker}...`)
      
      // Usar endpoint /refresh que busca especificamente o preço atual (1d)
      const response = await fetch(
        buildApiUrl(`api/stocks/${ticker}/refresh`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        console.log('✅ Dados atualizados com sucesso!')
        console.log(`Preço atual retornado: R$ ${data.current_price?.toFixed(2) || 'N/A'}`)
        console.log(`Dividendos: ${data.dividends?.length || 0} registros`)
        
        // NOVO: Recarregar dados completos do servidor para garantir consistência
        // Isso garante que estamos vendo exatamente o que foi salvo no banco
        console.log('🔄 Recarregando dados do servidor para validar salvamento...')
        
        try {
          const reloadResponse = await fetch(
            buildApiUrl(`api/stocks/${ticker}/view?range=${selectedRange}&force_update=false`),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          
          const reloadData = await reloadResponse.json()
          
          if (reloadResponse.ok && reloadData.status === 'success') {
            // Atualiza com dados frescos do banco
            setStockData(reloadData.data)
            console.log('✅ Dados recarregados do banco de dados')
            console.log(`Último preço no banco: R$ ${reloadData.data.prices[reloadData.data.prices.length - 1]?.price?.toFixed(2) || 'N/A'}`)
          }
        } catch (error) {
          console.error('❌ Erro ao recarregar dados:', error)
          // Se falhar, mantém dados antigos
        }
        
        // Se a ação está na carteira, invalidar cache da carteira
        if (isInPortfolio(ticker)) {
          console.log(`💰 Preço atualizado via refresh para ${ticker} que está em carteira - invalidando cache`)
          invalidatePortfolioFullCache()
        }
      } else {
        console.error('❌ Erro ao atualizar:', data.message)
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com backend:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="acao-page">
      <Logo />
      <BackNavigation from={from} />
      <ReloadButton onClick={handleRefresh} isLoading={isRefreshing} />
      <PageTitle title={ticker} />
      {companyName && <PageSubtitle subtitle={companyName} />}
      
      {/* Gráfico de Histórico de Preços */}
      {stockData && stockData.prices && (
        <PriceChart 
          prices={stockData.prices} 
          ticker={ticker}
          onRangeChange={handleRangeChange}
          loading={chartLoading}
        />
      )}
      
      {/* Gráfico de Dividendos */}
      {stockData && stockData.dividends && (
        <DividendsChart dividends={stockData.dividends} ticker={ticker} />
      )}
      
      {/* Editor de Quantidade e Observações */}
      {stockData && (
        <StockEditor ticker={ticker} />
      )}
      
      {/* Loading do backend */}
      {isLoading && (
        <div className="backend-loading">
          <p>🔄 Carregando dados de {ticker}...</p>
        </div>
      )}
      
      {/* Erro do backend */}
      {backendError && !stockData && (
        <div className="backend-error">
          <p>❌ {backendError}</p>
        </div>
      )}
    </div>
  )
}

export default Acao 