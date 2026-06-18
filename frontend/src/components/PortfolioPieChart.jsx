import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import './PortfolioPieChart.css'

function PortfolioPieChart({ portfolio, compact = false }) {
  const { isDark } = useTheme()
  if (!portfolio || portfolio.length === 0) {
    return null
  }

  const chartHeight = compact ? 380 : 600
  const outerRadius = compact ? 118 : 200
  const chartCenterX = compact ? '34%' : '30%'

  // Calcular valor total da carteira
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.total_value || 0), 0)

  // Preparar dados para o gráfico de pizza
  const chartData = portfolio.map(stock => ({
    ticker: stock.ticker,
    value: stock.total_value || 0,
    percentage: totalValue > 0 ? ((stock.total_value || 0) / totalValue * 100).toFixed(1) : 0
  }))

  // Cores para as fatias
  const COLORS = {
    default: '#202128',
    hover: '#f65308'
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
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(data.value)}
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
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="recharts-pie-label-text"
      >
        <tspan x={x} dy="0">{ticker}</tspan>
        <tspan x={x} dy="1.2em">{percentage}%</tspan>
      </text>
    )
  }

  return (
    <div className={`portfolio-pie-chart-container${compact ? ' portfolio-pie-chart-container--compact' : ''}`}>
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
        <div className="total-label">Total</div>
        <div className="total-value">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(totalValue)}
        </div>
      </div>
    </div>
  )
}

export default PortfolioPieChart
