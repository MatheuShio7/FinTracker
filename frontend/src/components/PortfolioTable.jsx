import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyValue, formatQuantity as formatQuantityValue } from '../lib/format'
import './PortfolioTable.css'

function PortfolioTable({ portfolioData, loading, error, onRetry, readOnly = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation(['portfolio', 'common'])

  const formatCurrency = (value) => {
    return formatCurrencyValue(value) ?? t('common:na')
  }

  const formatQuantity = (quantity) => {
    return formatQuantityValue(quantity) ?? t('common:na')
  }

  const handleRowClick = (ticker) => {
    if (readOnly) {
      return
    }

    navigate(`/${ticker}`, { state: { from: 'wallet' } })
  }

  if (loading) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-loading">{t('loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-error">
          <p>{error}</p>
          <button onClick={onRetry} className="retry-button">
            {t('common:retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!readOnly && !user) {
    return (
      <div className="portfolio-table-container">
        <div className="portfolio-empty">
          {t('loginRequired')}
        </div>
      </div>
    )
  }

  if (portfolioData.length === 0) {
    return (
      <div className="portfolio-table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>{t('common:ticker')}</th>
              <th>{t('common:value')}</th>
              <th>{t('common:quantity')}</th>
              <th>{t('totalValue')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-row">
              <td colSpan="4">{t('empty')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="portfolio-table-container">
      <table className="portfolio-table">
        <thead>
          <tr>
            <th>{t('common:ticker')}</th>
            <th>{t('common:value')}</th>
            <th>{t('common:quantity')}</th>
            <th>{t('totalValue')}</th>
          </tr>
        </thead>
        <tbody>
          {portfolioData.map((stock) => (
            <tr
              key={stock.ticker}
              onClick={() => handleRowClick(stock.ticker)}
              className={`portfolio-row${readOnly ? ' portfolio-row-readonly' : ''}`}
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
