import './Landing.css'
import Logo from './components/Logo'
import { Link } from 'react-router-dom'


function Landing() {
  const year = new Date().getFullYear()

  return (
    <div className="landing-page">
      <Logo />

      <header className="landing-hero">
        <div className="hero-left">
          <div className="brand">
            <h1 className="landing-title">FinTracker</h1>
            <p className="landing-subtitle">Controle seus investimentos com clareza — acompanhe carteira, preços e dividendos em um só lugar.</p>
          
          </div>

          <div className="landing-ctas">
            <Link to="/login" className="auth-button auth-button-active cta primary">Entrar</Link>
            <Link to="/cadastro" className="auth-button auth-button-active cta primary">Cadastrar</Link>
          </div>
        </div>
      </header>

      <section className="landing-insights" aria-label="Visão geral do produto">
        <div className="features-row">
            <div className="feature-card">
            <i className="bi bi-pie-chart-fill feature-icon" aria-hidden></i>
            <h3>Visão da carteira</h3>
            <p>Resumo visual da performance e alocação dos seus ativos.</p>
            </div>

            <div className="feature-card">
            <i className="bi bi-clock-history feature-icon" aria-hidden></i>
            <h3>Preços e histórico</h3>
            <p>Dados de preço em tempo real e histórico para decisões informadas.</p>
            </div>

            <div className="feature-card">
            <i className="bi bi-wallet2 feature-icon" aria-hidden></i>
            <h3>Transações & dividendos</h3>
            <p>Registre e acompanhe entradas, saídas e pagamentos de dividendos.</p>
            </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">R$ 124.532</div>
            <div className="stat-label">Valor total da carteira</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">+3.8%</div>
            <div className="stat-label">Retorno (30d)</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">R$ 1.256</div>
            <div className="stat-label">Dividendos (YTD)</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <h4>Desempenho (últimos 30 dias)</h4>
            <svg className="mock-chart" viewBox="0 0 200 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <polyline fill="none" stroke="#f65308" strokeWidth="3" points="0,45 20,40 40,30 60,35 80,20 100,25 120,18 140,22 160,12 180,20 200,10" />
            </svg>
          </div>

          <div className="chart-card">
            <h4>Distribuição por setores</h4>
            <svg className="mock-pie" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle r="40" cx="50" cy="50" fill="#2a2b30" />
              <path d="M50 10 A40 40 0 0 1 86 34 L50 50 Z" fill="#f65308" />
              <path d="M86 34 A40 40 0 0 1 60 88 L50 50 Z" fill="#ff8c42" />
              <path d="M60 88 A40 40 0 0 1 14 66 L50 50 Z" fill="#4ade80" />
            </svg>
          </div>

          <div className="chart-card">
            <h4>Ativos top 5 (simulado)</h4>
            <div className="mock-bars">
              <div className="bar"><span style={{width: '85%'}}></span><small>ACAO1</small></div>
              <div className="bar"><span style={{width: '70%'}}></span><small>ACAO2</small></div>
              <div className="bar"><span style={{width: '55%'}}></span><small>ACAO3</small></div>
              <div className="bar"><span style={{width: '40%'}}></span><small>ACAO4</small></div>
              <div className="bar"><span style={{width: '28%'}}></span><small>ACAO5</small></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">FinTracker © {year}</footer>
    </div>
  )
}

export default Landing
