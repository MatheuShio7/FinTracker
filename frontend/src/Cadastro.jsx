import './Cadastro.css'
import Logo from './components/Logo'
import InvestmentIllustration from './components/InvestmentIllustration'
import AuthCard from './components/AuthCard'
import { useTranslation } from 'react-i18next'

function Cadastro() {
  const { t } = useTranslation('auth')

  return (
    <div className="cadastro-page">
      <Logo />
      <InvestmentIllustration />
      <AuthCard title={t('signupTitle')} type="cadastro" />
    </div>
  )
}

export default Cadastro
