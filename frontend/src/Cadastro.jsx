import './Cadastro.css'
import Logo from './components/Logo'
import InvestmentIllustration from './components/InvestmentIllustration'
import AuthCard from './components/AuthCard'

function Cadastro() {
  return (
    <div className="cadastro-page">
      <Logo />
      <InvestmentIllustration />
      <AuthCard title="Cadastro" />
    </div>
  )
}

export default Cadastro 