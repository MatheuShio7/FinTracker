import './Login.css'
import Logo from './components/Logo'
import InvestmentIllustration from './components/InvestmentIllustration'
import AuthCard from './components/AuthCard'
import { useTranslation } from 'react-i18next'

function Login() {
  const { t } = useTranslation('auth')

  return (
    <div className="login-page">
      <Logo />
      <InvestmentIllustration />
      <AuthCard title={t('loginTitle')} type="login" />
    </div>
  )
}

export default Login
