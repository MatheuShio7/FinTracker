import { useEffect, useState } from 'react'
import './NotificationsButton.css'

function NotificationsButton({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        className={`reload-button notifications-button ${className}`}
        onClick={() => setIsOpen(true)}
        title="Ver notificações"
        aria-label="Ver notificações"
      >
        <i className="bi bi-bell-fill"></i>
      </button>

      {isOpen && (
        <div
          className="notifications-modal-overlay"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="notifications-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Notificações"
          >
            <div className="notifications-modal-header">
              <h3>Notificações</h3>
              <button
                type="button"
                className="notifications-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar notificações"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="notifications-modal-body">
              <div className="notifications-empty-state">
                <i className="bi bi-bell-slash-fill"></i>
                <p>Nenhuma notificação no momento.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationsButton