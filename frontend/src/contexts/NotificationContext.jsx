import React, { createContext, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const NotificationContext = createContext();

/**
 * NotificationProvider - Manages global toast/notification state
 * Provides methods to show success, error, warning, and info notifications
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { t } = useTranslation();

  /**
   * Add a new notification
   * @param {string} message - Message to display (can be translation key with 't:' prefix)
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Auto-dismiss duration in ms (0 to disable)
   */
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    
    setNotifications(prev => [...prev, {
      id,
      message,
      type,
      duration
    }]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message, duration = 5000) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const error = useCallback((message, duration = 7000) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const warning = useCallback((message, duration = 6000) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  const info = useCallback((message, duration = 5000) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
