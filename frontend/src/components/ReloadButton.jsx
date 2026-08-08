import { useTranslation } from 'react-i18next'
import './ReloadButton.css'

function ReloadButton({ onClick, isLoading = false, className = '' }) {
  const { t } = useTranslation('common')

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
      title={isLoading ? t('reloadLoading') : t('reloadIdle')}
    >
      <i className={`bi bi-arrow-clockwise ${isLoading ? 'spinning' : ''}`}></i>
    </button>
  )
}

export default ReloadButton
