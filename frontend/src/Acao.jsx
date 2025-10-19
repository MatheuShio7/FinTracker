import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './Acao.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import PageSubtitle from './components/PageSubtitle'
import BackNavigation from './components/BackNavigation'
import ReloadButton from './components/ReloadButton'

function Acao() {
  const { ticker } = useParams()
  const location = useLocation()
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [stockData, setStockData] = useState(null) // Dados do backend (preços e dividendos)
  const [backendError, setBackendError] = useState(null) // Erros do backend
  
  // Captura de onde o usuário veio (padrão: Explorar)
  const from = location.state?.from || 'Explorar'

  useEffect(() => {
    const fetchStockData = async () => {
      if (!ticker) return

      setIsLoading(true)
      
      try {
        // =====================================================================
        // BUSCA 1: Company Name do Supabase
        // =====================================================================
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

        // =====================================================================
        // BUSCA 2: Preços e Dividendos do Backend Flask
        // =====================================================================
        try {
          console.log(`🔄 Buscando dados de ${ticker} do backend...`)
          
          const response = await fetch(
            `http://localhost:5000/api/stocks/${ticker}/view?range=3m`,
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
        setCompanyName('Erro ao carregar')
      } finally {
        // Remove loading somente após AMBAS as buscas terminarem
        setIsLoading(false)
      }
    }

    fetchStockData()
  }, [ticker])

  return (
    <div className="acao-page">
      <Logo />
      <BackNavigation from={from} />
      <ReloadButton />
      <PageTitle title={ticker} />
      {!isLoading && companyName && <PageSubtitle subtitle={companyName} />}
    </div>
  )
}

export default Acao 