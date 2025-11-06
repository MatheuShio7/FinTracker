import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './PortfolioTable.css'

function PortfolioTable({ portfolioData, loading, error, onRetry }) {
  const navigate = useNavigate()
  const { user } = useAuth()


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
          <button onClick={onRetry} className="retry-button">
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
  if (portfolioData.length === 0) {
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
          {portfolioData.map((stock) => (
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

