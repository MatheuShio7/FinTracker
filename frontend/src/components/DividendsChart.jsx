import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './DividendsChart.css'

function DividendsChart({ dividends, ticker }) {
  if (!dividends || dividends.length === 0) {
    return (
      <div className="dividends-chart-container">
        <div className="chart-empty">
          <p>📊 Sem dados de dividendos disponíveis</p>
        </div>
      </div>
    )
  }

  // Formatar dados para o Recharts (inverte para mostrar do mais antigo ao mais recente)
  const chartData = dividends.map(item => ({
    date: item.payment_date || item.date || item.ex_date || 'N/A',
    value: parseFloat(item.value) || 0
  })).reverse()

  // Formatar data no tooltip (dd/mm/yyyy)
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'Data indisponível'
    
    // Se já estiver no formato dd/mm/yyyy
    if (dateString.includes('/')) return dateString
    
    // Se estiver no formato yyyy-mm-dd
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    return dateString
  }

  // Formatar valor no tooltip (R$ xx.xx)
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0.00'
    return `R$ ${value.toFixed(2)}`
  }

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].payload) {
      const data = payload[0].payload
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDate(data.date)}</p>
          <p className="tooltip-value">{formatValue(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  // Calcular valores mín e máx para ajustar escala do gráfico
  const dividend_values = chartData.map(d => d.value)
  const minValue = Math.min(...dividend_values)
  const maxValue = Math.max(...dividend_values)
  const padding = (maxValue - minValue) * 0.1
  
  // Calcular total e média dos dividendos
  const totalDividends = dividend_values.reduce((sum, val) => sum + val, 0)
  const avgDividends = totalDividends / dividend_values.length
  
  return (
    <div className="dividends-chart-container">
      <div className="chart-header">
        <h3>Histórico de Proventos</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              if (!date || date === 'N/A') return 'N/A'
              
              // Se já estiver no formato dd/mm/yyyy
              if (date.includes('/')) {
                return date
              }
              
              // Se estiver no formato yyyy-mm-dd
              if (date.includes('-')) {
                const [year, month, day] = date.split('-')
                return `${day}/${month}/${year}`
              }
              
              return date
            }}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          
          <YAxis 
            domain={[0, maxValue + padding]}
            tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            width={80}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            dataKey="value" 
            fill="#f65308"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{formatValue(totalDividends)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Média</span>
            <span className="stat-value">{formatValue(avgDividends)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Máximo</span>
            <span className="stat-value">{formatValue(maxValue)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DividendsChart

