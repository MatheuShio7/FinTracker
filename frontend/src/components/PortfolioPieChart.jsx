import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import './PortfolioPieChart.css'

function PortfolioPieChart({ portfolio }) {
  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="portfolio-pie-chart-container">
        <div className="chart-empty">
          <p>📊 Nenhuma ação na carteira</p>
        </div>
      </div>
    )
  }

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

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="custom-tooltip">
          <p className="tooltip-ticker">{data.ticker}</p>
          <p className="tooltip-value">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(data.value)}
          </p>
          <p className="tooltip-percentage">{data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  // Renderizar labels customizados nas fatias
  const renderLabel = (entry) => {
    return `${entry.ticker} (${entry.percentage}%)`
  }

  return (
    <div className="portfolio-pie-chart-container">
      <ResponsiveContainer width="100%" height={600}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={200}
            innerRadius={0}
            fill={COLORS.default}
            dataKey="value"
            paddingAngle={3}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS.default}
                className="pie-cell"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PortfolioPieChart
