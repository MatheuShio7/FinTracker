import './ReloadButton.css'

function ReloadButton({ onClick, isLoading = false, className = '' }) {
  const handleClick = () => {
    if (onClick && !isLoading) {
      onClick()
    }
  }

  return (
    <button 
      className={`reload-button ${isLoading ? 'loading' : ''} ${className}`}
      onClick={handleClick}
      disabled={isLoading}
      title={isLoading ? 'Atualizando...' : 'Atualizar dados'}
    >
      <i className={`bi bi-arrow-clockwise ${isLoading ? 'spinning' : ''}`}></i>
    </button>
  )
}

export default ReloadButton


