import { useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { formatCurrency } from '../lib/format'
import { useElementWidth } from '../lib/useResponsive'
import './PortfolioPieChart.css'

// Larguras (do container, não da janela) que definem o layout do gráfico
const STACKED_MAX_WIDTH = 640 // abaixo disso o total passa para baixo do gráfico
const NARROW_MAX_WIDTH = 1000 // abaixo disso o raio da pizza é reduzido

function PortfolioPieChart({ portfolio, compact = false }) {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const containerRef = useRef(null)
  const hasData = Boolean(portfolio) && portfolio.length > 0
  const containerWidth = useElementWidth(containerRef, hasData)

  if (!hasData) {
    return null
  }

  const baseHeight = compact ? 380 : 600
  const baseRadius = compact ? 118 : 200
  const baseCenterX = compact ? 0.34 : 0.3

  let layout = 'wide'
  if (containerWidth > 0 && containerWidth < STACKED_MAX_WIDTH) {
    layout = 'stacked'
  } else if (containerWidth > 0 && containerWidth < NARROW_MAX_WIDTH) {
    layout = 'narrow'
  }

  let chartHeight = baseHeight
  let outerRadius = baseRadius
  let chartCenterX = `${baseCenterX * 100}%`

  if (layout === 'narrow') {
    // Mantém espaço à esquerda para os rótulos das fatias
    outerRadius = Math.max(90, Math.min(baseRadius, Math.floor(containerWidth * baseCenterX) - 55))
    chartHeight = Math.min(baseHeight, outerRadius * 2 + 130)
  } else if (layout === 'stacked') {
    outerRadius = Math.max(60, Math.min(baseRadius, Math.floor(containerWidth / 2) - 60))
    chartCenterX = '50%'
    chartHeight = outerRadius * 2 + 110
  }

  // Calcular valor total da carteira
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.total_value || 0), 0)

  // Preparar dados para o gráfico de pizza
  const chartData = portfolio.map(stock => ({
    ticker: stock.ticker,
    value: stock.total_value || 0,
    percentage: totalValue > 0 ? ((stock.total_value || 0) / totalValue * 100).toFixed(1) : 0
  }))

  const themeStyles = getComputedStyle(document.documentElement)
  const COLORS = {
    default: themeStyles.getPropertyValue('--color-pie-fill').trim() || '#2a2a2a',
    hover: themeStyles.getPropertyValue('--color-accent').trim() || '#f65308'
  }

  const tooltipThemeClass = isDark
    ? 'portfolio-pie-tooltip--dark'
    : 'portfolio-pie-tooltip--light'

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className={`portfolio-pie-tooltip ${tooltipThemeClass}`}>
          <p className="portfolio-pie-tooltip__ticker">{data.ticker}</p>
          <p className="portfolio-pie-tooltip__value">
            {formatCurrency(data.value)}
          </p>
          <p className="portfolio-pie-tooltip__percentage">{data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  // Renderizar labels customizados nas fatias
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, ticker, percentage }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 1
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        style={{ color: 'var(--color-text-primary)' }}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="recharts-pie-label-text"
      >
        <tspan x={x} dy="0">{ticker}</tspan>
        <tspan x={x} dy="1.2em">{percentage}%</tspan>
      </text>
    )
  }

  const containerClassName = [
    'portfolio-pie-chart-container',
    compact ? 'portfolio-pie-chart-container--compact' : '',
    layout !== 'wide' ? `portfolio-pie-chart-container--${layout}` : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClassName} ref={containerRef}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={chartData}
            cx={chartCenterX}
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={outerRadius}
            innerRadius={0}
            fill={COLORS.default}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS.default}
                className="pie-cell"
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            isAnimationActive={false}
            contentStyle={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              boxShadow: 'none',
            }}
            wrapperStyle={{ outline: 'none', zIndex: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="portfolio-total-info">
        <div className="total-label">{t('total')}</div>
        <div className="total-value">
          {formatCurrency(totalValue)}
        </div>
      </div>
    </div>
  )
}

export default PortfolioPieChart
