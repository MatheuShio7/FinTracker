import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePortfolio } from '../contexts/PortfolioContext'
import { buildApiUrl } from '../config/api'
import './PortfolioTable.css'

function PortfolioTable() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cache } = usePortfolio()
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Buscar dados da carteira
  const fetchPortfolio = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        buildApiUrl(`api/portfolio/full?user_id=${user.id}`)
      )
      const data = await response.json()

      if (data.status === 'success') {
        setPortfolio(data.data)
      } else {
        setError(data.message || 'Erro ao buscar carteira')
      }
    } catch (err) {
      console.error('Erro ao buscar carteira:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados ao montar componente
  useEffect(() => {
    fetchPortfolio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Recarregar quando o cache do portfolio mudar (ação adicionada/removida)
  useEffect(() => {
    if (cache.timestamp && user) {
      console.log('🔄 Portfolio atualizado, recarregando tabela...')
      fetchPortfolio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.timestamp])

  // Formatar valores monetários
  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Formatar quantidade
  const formatQuantity = (quantity) => {
    return new Intl.NumberFormat('pt-BR').format(quantity)
  }

  // Navegar para página da ação
  const handleRowClick = (ticker) => {
    navigate(`/${ticker}`, { state: { from: 'Carteira' } })
  }

  // Loading state
  if (loading) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-loading">Carregando carteira...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-error">
          <p>{error}</p>
          <button onClick={fetchPortfolio} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Usuário não logado
  if (!user) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-empty">
          Faça login para ver sua carteira
        </div>
      </div>
    )
  }

  // Carteira vazia
  if (portfolio.length === 0) {
    return (
      <div className="portfolio-table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Valor</th>
              <th>Quantidade</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-row">
              <td colSpan="4">Nenhuma ação em carteira</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Tabela com dados
  return (
    <div className="portfolio-table-container">
      <table className="portfolio-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Valor</th>
            <th>Quantidade</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((stock) => (
            <tr
              key={stock.ticker}
              onClick={() => handleRowClick(stock.ticker)}
              className="portfolio-row"
            >
              <td className="ticker-cell">{stock.ticker}</td>
              <td className="price-cell">
                {formatCurrency(stock.current_price)}
              </td>
              <td className="quantity-cell">
                {formatQuantity(stock.quantity)}
              </td>
              <td className="total-cell">
                {formatCurrency(stock.total_value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PortfolioTable

