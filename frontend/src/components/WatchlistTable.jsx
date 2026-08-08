import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyValue } from '../lib/format'
import './WatchlistTable.css'

function WatchlistTable({ watchlistData, loading, error, onRetry }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation(['explore', 'common'])

  const formatCurrency = (value) => {
    return formatCurrencyValue(value) ?? t('common:na')
  }

  const handleRowClick = (ticker) => {
    navigate(`/${ticker}`, { state: { from: 'explore' } })
  }

  if (loading) {
    return (
      <div className="watchlist-table-container">
        <div className="watchlist-loading">{t('watchlist.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="watchlist-table-container">
        <div className="watchlist-error">
          <p>{error}</p>
          <button onClick={onRetry} className="retry-button">
            {t('common:retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="watchlist-table-container">
        <div className="watchlist-empty">
          {t('watchlist.loginRequired')}
        </div>
      </div>
    )
  }

  if (watchlistData.length === 0) {
    return (
      <div className="watchlist-table-container">
        <table className="watchlist-table">
          <thead>
            <tr>
              <th>{t('common:ticker')}</th>
              <th>{t('common:value')}</th>
              <th>{t('watchlist.lastDividend')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-row">
              <td colSpan="3">{t('watchlist.empty')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="watchlist-table-container">
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>{t('common:ticker')}</th>
            <th>{t('common:value')}</th>
            <th>{t('watchlist.lastDividend')}</th>
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
                {stock.last_dividend ? formatCurrency(stock.last_dividend.value) : t('common:na')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WatchlistTable
