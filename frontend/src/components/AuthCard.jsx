import './AuthCard.css'

function AuthCard({ title }) {
  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <img 
          src="/logo.png" 
          alt="FinTracker Logo" 
          className="auth-card-logo"
        />
        <h1 className="auth-card-title">{title}</h1>
      </div>
    </div>
  )
}

export default AuthCard 