import './Logo.css'

function Logo() {
  return (
    <div className="logo">
      <div className="logo-content">
        <img 
          src="/logo.png" 
          alt="FinTracker Logo" 
          className="logo-image"
        />
        <span className="logo-text">FinTracker</span>
      </div>
    </div>
  )
}

export default Logo 