import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './PriceChart.css'

function PriceChart({ prices, ticker }) {
  if (!prices || prices.length === 0) {
    return (
      <div className="price-chart-container">
        <div className="chart-empty">
          <p>📊 Sem dados de preços disponíveis</p>
        </div>
      </div>
    )
  }

  // Formatar dados para o Recharts
  const chartData = prices.map(item => ({
    date: item.date,
    price: parseFloat(item.price)
  }))

  // Formatar data no tooltip (dd/mm/yyyy)
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Formatar preço no tooltip (R$ xx.xx)
  const formatPrice = (value) => {
    return `R$ ${value.toFixed(2)}`
  }

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDate(payload[0].payload.date)}</p>
          <p className="tooltip-price">{formatPrice(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  // Calcular valores mín e máx para ajustar escala do gráfico
  const prices_values = chartData.map(d => d.price)
  const minPrice = Math.min(...prices_values)
  const maxPrice = Math.max(...prices_values)
  const padding = (maxPrice - minPrice) * 0.1
  
  // Determinar cor da linha baseado na variação (primeiro vs último preço)
  const firstPrice = prices_values[0]
  const lastPrice = prices_values[prices_values.length - 1]
  const lineColor = lastPrice >= firstPrice ? '#24b224' : '#e60111' // Verde se subiu, vermelho se caiu
  
  return (
    <div className="price-chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              const [, month, day] = date.split('-')
              return `${day}/${month}`
            }}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
            stroke="#9ca3af"
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

      <div className="chart-footer">
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Mínimo</span>
            <span className="stat-value">{formatPrice(minPrice)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Máximo</span>
            <span className="stat-value">{formatPrice(maxPrice)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Último</span>
            <span className="stat-value">{formatPrice(prices_values[prices_values.length - 1])}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceChart

