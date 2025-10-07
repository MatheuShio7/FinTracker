import './ReloadButton.css'

function ReloadButton({ onClick }) {
  const handleClick = () => {
    // Função placeholder - será implementada futuramente
    if (onClick) {
      onClick()
    }
  }

  return (
    <button className="reload-button" onClick={handleClick}>
      <i className="bi bi-arrow-clockwise"></i>
    </button>
  )
}

export default ReloadButton


