import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '../lib/format'
import './PriceChart.css'

function PriceChart({ prices, onRangeChange, loading }) {
  const [selectedRange, setSelectedRange] = useState('3m')
  const { t, i18n } = useTranslation('stock')

  const handleRangeChange = (newRange) => {
    setSelectedRange(newRange)
    if (onRangeChange) {
      onRangeChange(newRange)
    }
  }

  const rangeLabels = {
    '7d': t('price.range.7d'),
    '1m': t('price.range.1m'),
    '3m': t('price.range.3m'),
  }

  const formatAxisDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(`${dateString}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateString
    return formatDate(date, { day: '2-digit', month: '2-digit' }) ?? dateString
  }

  const formatTooltipDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(`${dateString}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateString
    return formatDate(date) ?? dateString
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="price-chart-container">
        <div className="chart-header">
          <h2>{t('price.title')}</h2>
          <div className="range-selector">
            {Object.keys(rangeLabels).map((range) => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={selectedRange === range ? 'selected' : ''}
              >
                {rangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-empty">
          <p>{t('price.empty')}</p>
        </div>
      </div>
    )
  }

  const chartData = prices.map(item => ({
    date: item.date,
    price: parseFloat(item.price)
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatTooltipDate(payload[0].payload.date)}</p>
          <p className="tooltip-price">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const prices_values = chartData.map(d => d.price)
  const minPrice = Math.min(...prices_values)
  const maxPrice = Math.max(...prices_values)
  const padding = (maxPrice - minPrice) * 0.1

  const firstPrice = prices_values[0]
  const lastPrice = prices_values[prices_values.length - 1]
  const themeStyles = getComputedStyle(document.documentElement)
  const lineColor = lastPrice >= firstPrice
    ? themeStyles.getPropertyValue('--color-success').trim()
    : themeStyles.getPropertyValue('--color-danger').trim()
  const gridColor = themeStyles.getPropertyValue('--color-chart-grid').trim()
  const axisColor = themeStyles.getPropertyValue('--color-chart-axis').trim()

  return (
    <div className="price-chart-container" key={i18n.language}>
      <div className="chart-header">
        <h2>{t('price.title')}</h2>
        <div className="range-selector">
          {Object.keys(rangeLabels).map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              className={selectedRange === range ? 'selected' : ''}
              disabled={loading}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">
          <p>{t('price.loading')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={70}
          />

          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(value) => formatCurrency(value) ?? ''}
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
      )}

      {!loading && (
        <div className="chart-footer">
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">{t('price.min')}</span>
              <span className="stat-value">{formatCurrency(minPrice)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('price.max')}</span>
              <span className="stat-value">{formatCurrency(maxPrice)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('price.last')}</span>
              <span className="stat-value">{formatCurrency(prices_values[prices_values.length - 1])}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceChart
