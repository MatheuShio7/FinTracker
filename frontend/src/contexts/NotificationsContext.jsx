import React, { createContext, useContext, useCallback, useMemo, useState } from 'react'
import { authFetch } from '../lib/authFetch'

const NotificationsContext = createContext()

function mapNotificationFromApi(notification) {
  return {
    id: notification.id,
    type: notification.type === 'mfa_disabled' ? 'warning' : (notification.type || 'info'),
    title: notification.title,
    description: notification.description,
    icon: notification.icon,
    metadata: notification.metadata || {},
    read_at: notification.read_at,
    created_at: notification.created_at,
    rawType: notification.type,
  }
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  )

  const hasNotifications = unreadCount > 0

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await authFetch('api/notifications')

      if (!response.ok) {
        console.error('Erro ao carregar notificações:', response.status)
        return
      }

      const data = await response.json()

      if (data.status === 'success') {
        setNotifications((data.data || []).map(mapNotificationFromApi))
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notification.id)
      if (exists) {
        return prev
      }

      return [{
        ...notification,
        read_at: notification.read_at ?? null,
      }, ...prev]
    })
  }, [])

  const markNotificationAsSeen = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === notificationId
        ? { ...notification, read_at: notification.read_at || new Date().toISOString() }
        : notification
    )))

    try {
      await authFetch(`api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [])

  const markAllNotificationsAsSeen = useCallback(async () => {
    const now = new Date().toISOString()

    setNotifications((prev) => prev.map((notification) => (
      notification.read_at ? notification : { ...notification, read_at: now }
    )))

    try {
      await authFetch('api/notifications/read-all', {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }, [])

  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
  }, [])

  const resetNotificationsState = useCallback(() => {
    setNotifications([])
    setIsLoading(false)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    hasNotifications,
    isLoading,
    loadNotifications,
    addNotification,
    removeNotification,
    markNotificationAsSeen,
    markAllNotificationsAsSeen,
    resetNotificationsState,
    clearNotifications,
  }), [
    notifications,
    unreadCount,
    hasNotifications,
    isLoading,
    loadNotifications,
    addNotification,
    removeNotification,
    markNotificationAsSeen,
    markAllNotificationsAsSeen,
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
