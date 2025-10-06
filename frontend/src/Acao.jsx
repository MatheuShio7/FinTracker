import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './Acao.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import PageSubtitle from './components/PageSubtitle'

function Acao() {
  const { ticker } = useParams()
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStockData = async () => {
      if (!ticker) return

      setIsLoading(true)
      try {
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
      } catch (error) {
        console.error('Erro na busca:', error)
        setCompanyName('Erro ao carregar')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockData()
  }, [ticker])

  return (
    <div className="acao-page">
      <Logo />
      <PageTitle title={ticker} />
      {!isLoading && companyName && <PageSubtitle subtitle={companyName} />}
    </div>
  )
}

export default Acao 