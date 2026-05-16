import React, { createContext, useContext, useCallback, useMemo, useState } from 'react'

const NotificationsContext = createContext()

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [seenNotificationIds, setSeenNotificationIds] = useState([])

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === notification.id)
      if (exists) return prev
      return [...prev, notification]
    })

    setSeenNotificationIds((prev) => prev.filter((id) => id !== notification.id))
  }, [])

  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    setSeenNotificationIds((prev) => prev.filter((id) => id !== notificationId))
  }, [])

  const markNotificationAsSeen = useCallback((notificationId) => {
    setSeenNotificationIds((prev) => {
      if (prev.includes(notificationId)) return prev
      return [...prev, notificationId]
    })
  }, [])

  const resetNotificationsState = useCallback(() => {
    setNotifications([])
    setSeenNotificationIds([])
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const hasNotifications = notifications.some((notification) => !seenNotificationIds.includes(notification.id))

  const contextValue = useMemo(() => ({
    notifications,
    hasNotifications,
    addNotification,
    removeNotification,
    markNotificationAsSeen,
    resetNotificationsState,
    clearNotifications,
  }), [
    notifications,
    hasNotifications,
    addNotification,
    removeNotification,
    markNotificationAsSeen,
    resetNotificationsState,
    clearNotifications,
  ])

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  }
  return context
}
