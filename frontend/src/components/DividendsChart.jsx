import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '../lib/format'
import './DividendsChart.css'

function DividendsChart({ dividends }) {
  const { t, i18n } = useTranslation(['stock', 'common'])

  if (!dividends || dividends.length === 0) {
    return (
      <div className="dividends-chart-container">
        <div className="chart-empty">
          <p>{t('dividends.empty')}</p>
        </div>
      </div>
    )
  }

  const chartData = dividends.map(item => ({
    date: item.payment_date || item.date || item.ex_date || null,
    value: parseFloat(item.value) || 0
  })).reverse()

  const formatChartDate = (dateString) => {
    if (!dateString) return t('dividends.dateUnavailable')

    if (dateString.includes('/')) return dateString

    if (dateString.includes('-')) {
      const date = new Date(`${dateString}T00:00:00`)
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date) ?? dateString
      }
    }

    return dateString
  }

  const formatAxisDate = (dateString) => {
    if (!dateString) return t('common:na')

    if (dateString.includes('/')) return dateString

    if (dateString.includes('-')) {
      const date = new Date(`${dateString}T00:00:00`)
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' }) ?? dateString
      }
    }

    return dateString
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].payload) {
      const data = payload[0].payload
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatChartDate(data.date)}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const dividend_values = chartData.map(d => d.value)
  const minValue = Math.min(...dividend_values)
  const maxValue = Math.max(...dividend_values)
  const padding = (maxValue - minValue) * 0.1

  const totalDividends = dividend_values.reduce((sum, val) => sum + val, 0)
  const avgDividends = totalDividends / dividend_values.length

  const themeStyles = getComputedStyle(document.documentElement)
  const gridColor = themeStyles.getPropertyValue('--color-chart-grid').trim()
  const axisColor = themeStyles.getPropertyValue('--color-chart-axis').trim()
  const accentColor = themeStyles.getPropertyValue('--color-accent').trim()

  return (
    <div className="dividends-chart-container" key={i18n.language}>
      <div className="chart-header">
        <h3>{t('dividends.title')}</h3>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
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
            domain={[0, maxValue + padding]}
            tickFormatter={(value) => formatCurrency(value) ?? ''}
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="value"
            fill={accentColor}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">{t('dividends.total')}</span>
            <span className="stat-value">{formatCurrency(totalDividends)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('dividends.avg')}</span>
            <span className="stat-value">{formatCurrency(avgDividends)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('dividends.max')}</span>
            <span className="stat-value">{formatCurrency(maxValue)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DividendsChart
