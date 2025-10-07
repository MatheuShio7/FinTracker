import './ReloadButton.css'

function ReloadButton({ onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Comportamento padrão: recarregar a página
      window.location.reload()
    }
  }

  return (
    <button className="reload-button" onClick={handleClick}>
      <i className="bi bi-arrow-clockwise"></i>
    </button>
  )
}

export default ReloadButton

