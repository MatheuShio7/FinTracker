import AuthLayout from './components/AuthLayout'
import AuthCard from './components/AuthCard'

function Cadastro() {
  return (
    <AuthLayout variant="signup">
      <AuthCard type="cadastro" />
    </AuthLayout>
  )
}

export default Cadastro
