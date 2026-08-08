import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './BackNavigation.css'

function BackNavigation({ from = 'explore' }) {
  const navigate = useNavigate()
  const { t } = useTranslation('nav')

  const normalizedFrom = from === 'Carteira' || from === 'wallet' ? 'wallet' : 'explore'

  const handleClick = () => {
    if (normalizedFrom === 'wallet') {
      navigate('/carteira')
    } else {
      navigate('/explorar')
    }
  }

  return (
    <div className="back-navigation" onClick={handleClick}>
      <i className="bi bi-chevron-left"></i>
      <span>{t(normalizedFrom)}</span>
    </div>
  )
}

export default BackNavigation
