import { useEffect, useState } from 'react'
import './NotificationsButton.css'
import { useNotifications } from '../contexts/NotificationsContext'
import { useNavigate } from 'react-router-dom'

function NotificationsButton({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, hasNotifications, markNotificationAsSeen } = useNotifications()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🔔 NotificationsButton - Notificações atualizadas:', {
      count: notifications.length,
      hasNotifications,
      notifications: notifications.map(n => ({ id: n.id, type: n.type }))
    })
  }, [notifications, hasNotifications])

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

  const handleNotificationClick = (notification) => {
    if (notification.type === 'warning' && notification.id === 'mfa-disabled') {
      markNotificationAsSeen(notification.id)
      navigate('/configuracoes')
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (notification) => {
    if (notification.icon) {
      return `bi-${notification.icon}`
    }
    if (notification.type === 'warning') {
      return 'bi-exclamation-triangle-fill'
    }
    if (notification.type === 'error') {
      return 'bi-exclamation-circle-fill'
    }
    return 'bi-info-circle-fill'
  }

  return (
    <>
      <button
        type="button"
        className={`reload-button notifications-button ${className}${
          hasNotifications ? ' has-notifications' : ''
        }`}
        onClick={() => setIsOpen(true)}
        title="Ver notificações"
        aria-label="Ver notificações"
      >
        <i className="bi bi-bell-fill"></i>
        {hasNotifications && (
          <span className="notifications-badge">{notifications.length}</span>
        )}
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
              {notifications.length === 0 ? (
                <div className="notifications-empty-state">
                  <i className="bi bi-bell-slash-fill"></i>
                  <p>Nenhuma notificação no momento.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item notification-${notification.type}`}
                      onClick={() => handleNotificationClick(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotificationClick(notification)
                        }
                      }}
                    >
                      <i
                        className={`bi ${getNotificationIcon(
                          notification
                        )} notification-icon`}
                      ></i>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationsButton