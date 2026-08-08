import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './NotificationsButton.css'
import { useNotifications } from '../contexts/NotificationsContext'
import { useNavigate } from 'react-router-dom'

function NotificationsButton({ className = '' }) {
  const { t } = useTranslation('notifications')
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    hasNotifications,
    markNotificationAsSeen,
    markAllNotificationsAsSeen,
    deleteNotification,
  } = useNotifications()
  const navigate = useNavigate()

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
    if (notification.rawType === 'mfa_disabled') {
      markNotificationAsSeen(notification.id)
      navigate('/configuracoes')
      setIsOpen(false)
      return
    }

    if (notification.rawType === 'group_invite_received') {
      const token = notification.metadata?.invite_token
      markNotificationAsSeen(notification.id)
      setIsOpen(false)

      if (token) {
        navigate(`/grupos?convite=${encodeURIComponent(token)}`)
      } else {
        navigate('/grupos')
      }
      return
    }

    if (notification.rawType === 'group_reconsent_required') {
      const groupId = notification.metadata?.group_id
      markNotificationAsSeen(notification.id)
      setIsOpen(false)

      if (groupId) {
        navigate(`/grupos?grupo=${encodeURIComponent(groupId)}`)
      } else {
        navigate('/grupos')
      }
      return
    }

    if (
      notification.rawType === 'group_join_pending'
      || notification.rawType === 'group_join_approved'
      || notification.rawType === 'group_wallet_managed'
    ) {
      const groupId = notification.metadata?.group_id
      markNotificationAsSeen(notification.id)
      setIsOpen(false)

      if (groupId) {
        navigate(`/grupos?grupo=${encodeURIComponent(groupId)}`)
      } else {
        navigate('/grupos')
      }
      return
    }

    if (!notification.read_at) {
      markNotificationAsSeen(notification.id)
    }
  }

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation()
    deleteNotification(notificationId)
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
        title={t('triggerTitle')}
        aria-label={t('triggerAria')}
      >
        <i className="bi bi-bell-fill"></i>
        {hasNotifications && (
          <span className="notifications-badge">{unreadCount}</span>
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
            aria-label={t('modalAria')}
          >
            <div className="notifications-modal-header">
              <div className="notifications-modal-header-title">
                <h3>{t('title')}</h3>
                {unreadCount > 0 && (
                  <span className="notifications-unread-summary">
                    {unreadCount === 1
                      ? t('unreadOne', { count: unreadCount })
                      : t('unreadMany', { count: unreadCount })}
                  </span>
                )}
              </div>
              <div className="notifications-modal-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notifications-mark-all-button"
                    onClick={() => markAllNotificationsAsSeen()}
                  >
                    {t('markAllRead')}
                  </button>
                )}
                <button
                  type="button"
                  className="notifications-close-button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t('closeAria')}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <div className="notifications-modal-body">
              {notifications.length === 0 ? (
                <div className="notifications-empty-state">
                  <i className="bi bi-bell-slash-fill"></i>
                  <p>{t('empty')}</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => {
                    const isUnread = !notification.read_at

                    return (
                      <div
                        key={notification.id}
                        className={`notification-item notification-${notification.type}${
                          isUnread ? ' notification-unread' : ' notification-read'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleNotificationClick(notification)
                          }
                        }}
                      >
                        {isUnread && (
                          <span className="notification-unread-dot" aria-hidden="true" />
                        )}
                        <i
                          className={`bi ${getNotificationIcon(
                            notification
                          )} notification-icon`}
                        ></i>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.description}</p>
                        </div>
                        <button
                          type="button"
                          className="notification-delete-button"
                          onClick={(event) => handleDeleteNotification(event, notification.id)}
                          aria-label={t('deleteAria')}
                          title={t('deleteTitle')}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    )
                  })}
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
