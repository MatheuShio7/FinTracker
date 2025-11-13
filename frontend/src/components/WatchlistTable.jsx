import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './WatchlistTable.css'

function WatchlistTable({ watchlistData, loading, error, onRetry }) {
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

  // Navegar para página da ação
  const handleRowClick = (ticker) => {
    navigate(`/${ticker}`, { state: { from: 'Explorar' } })
  }

  // Loading state
  if (loading) {
    return (
      <div className="watchlist-table-container">
        <div className="watchlist-loading">Carregando lista de observação...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="watchlist-table-container">
        <div className="watchlist-error">
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
      <div className="watchlist-table-container">
        <div className="watchlist-empty">
          Faça login para ver sua lista de observação
        </div>
      </div>
    )
  }

  // Watchlist vazia
  if (watchlistData.length === 0) {
    return (
      <div className="watchlist-table-container">
        <table className="watchlist-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Valor</th>
              <th>Último Provento</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-row">
              <td colSpan="3">Nenhuma ação na lista de observação</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Tabela com dados
  return (
    <div className="watchlist-table-container">
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Valor</th>
            <th>Último Provento</th>
          </tr>
        </thead>
        <tbody>
          {watchlistData.map((stock) => (
            <tr
              key={stock.ticker}
              onClick={() => handleRowClick(stock.ticker)}
              className="watchlist-row"
            >
              <td className="ticker-cell">{stock.ticker}</td>
              <td className="price-cell">
                {formatCurrency(stock.current_price)}
              </td>
              <td className="dividend-cell">
                {stock.last_dividend ? formatCurrency(stock.last_dividend.value) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WatchlistTable

