import AuthLayout from './components/AuthLayout'
import AuthCard from './components/AuthCard'

function Login() {
  return (
    <AuthLayout variant="login">
      <AuthCard type="login" />
    </AuthLayout>
  )
}

export default Login
