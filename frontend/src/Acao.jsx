import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import './Acao.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import PageSubtitle from './components/PageSubtitle'
import BackNavigation from './components/BackNavigation'
import ReloadButton from './components/ReloadButton'
import PriceChart from './components/PriceChart'
import DividendsChart from './components/DividendsChart'

function Acao() {
  const { ticker } = useParams()
  const location = useLocation()
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
          
          const response = await fetch(
            `http://localhost:5000/api/stocks/${ticker}/view?range=${selectedRange}`,
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
      
      // Chamar novo endpoint de refresh
      const response = await fetch(
        `http://localhost:5000/api/stocks/${ticker}/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        // Atualizar stockData com novos dados
        setStockData(prevData => {
          if (!prevData) return prevData
          
          // Atualizar preço atual nos dados de preços
          let updatedPrices = prevData.prices || []
          
          // Se há preço atual, atualizar no array de preços
          if (data.current_price && updatedPrices.length > 0) {
            // Pegar a data do último preço ou usar hoje
            const lastPrice = updatedPrices[updatedPrices.length - 1]
            const lastDate = lastPrice.date
            
            // Criar novo array com preço atualizado
            updatedPrices = [...updatedPrices]
            updatedPrices[updatedPrices.length - 1] = {
              date: lastDate,
              price: data.current_price
            }
          }
          
          return {
            ...prevData,
            prices: updatedPrices,
            dividends: data.dividends,
            timestamp: data.timestamp
          }
        })
        
        console.log('✅ Dados atualizados com sucesso!')
        console.log(`Preço atual: R$ ${data.current_price?.toFixed(2) || 'N/A'}`)
        console.log(`Dividendos: ${data.dividends?.length || 0} registros`)
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