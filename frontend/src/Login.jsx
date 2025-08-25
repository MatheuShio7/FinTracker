import './Login.css'
import Logo from './components/Logo'
import InvestmentIllustration from './components/InvestmentIllustration'
import AuthCard from './components/AuthCard'

function Login() {
  return (
    <div className="login-page">
      <Logo />
      <InvestmentIllustration />
      <AuthCard title="Login" />
    </div>
  )
}

export default Login
