import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX
} from 'react-icons/fi';
import './Toast.css';

/**
 * Toast Component - Individual notification toast
 * Displays success, error, warning, or info messages with icons
 */
const Toast = ({ notification, onRemove }) => {
  const { t } = useTranslation();

  // Get icon component based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FiCheckCircle className="toast-icon toast-icon-success" />;
      case 'error':
        return <FiAlertCircle className="toast-icon toast-icon-error" />;
      case 'warning':
        return <FiAlertTriangle className="toast-icon toast-icon-warning" />;
      case 'info':
      default:
        return <FiInfo className="toast-icon toast-icon-info" />;
    }
  };

  // Get label based on notification type
  const getLabel = () => {
    switch (notification.type) {
      case 'success':
        return t('messages.success');
      case 'error':
        return t('errors.error');
      case 'warning':
        return t('messages.warning');
      case 'info':
      default:
        return t('messages.info');
    }
  };

  // Get display message - handle translation keys
  const getDisplayMessage = () => {
    if (notification.message.startsWith('t:')) {
      return t(notification.message.substring(2));
    }
    return notification.message;
  };

  // Auto-dismiss timer
  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  return (
    <div className={`toast-wrapper toast-${notification.type}`}>
      <div className="toast-content">
        {getIcon()}
        <div className="toast-message">
          <strong className="toast-label">{getLabel()}</strong>
          <p className="toast-text">{getDisplayMessage()}</p>
        </div>
      </div>
      <button
        className="toast-close"
        onClick={() => onRemove(notification.id)}
        aria-label="Close notification"
      >
        <FiX size={20} />
      </button>
    </div>
  );
};

export default Toast;
