import React from 'react';
import Toast from './Toast';
import { useNotification } from '../contexts/NotificationContext';
import './Toast.css';

/**
 * ToastContainer - Displays all notifications
 * Should be placed at the root level of your app
 */
const ToastContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
