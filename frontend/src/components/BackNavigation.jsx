import { useNavigate } from 'react-router-dom'
import './BackNavigation.css'

function BackNavigation({ from = 'Explorar' }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (from === 'Carteira') {
      navigate('/carteira')
    } else {
      navigate('/explorar')
    }
  }

  return (
    <div className="back-navigation" onClick={handleClick}>
      <i className="bi bi-chevron-left"></i>
      <span>{from}</span>
    </div>
  )
}

export default BackNavigation


