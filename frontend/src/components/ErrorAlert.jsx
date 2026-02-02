import React from 'react';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './ErrorAlert.css';

/**
 * ErrorAlert Component
 * Displays error/success messages with optional dismiss button
 * Can accept either a plain message string or a translation key (prefixed with 't:')
 */
const ErrorAlert = ({ message, type = 'danger', onDismiss = null }) => {
  const { t, i18n } = useTranslation();
  if (!message) return null;

  // If message starts with 't:', treat it as a translation key
  const displayMessage = message.startsWith('t:') 
    ? t(message.substring(2))
    : message;

  // Determine the prefix label based on alert type
  const getAlertPrefix = () => {
    switch (type) {
      case 'success':
        return t('messages.success');
      case 'warning':
        return t('messages.warning');
      case 'info':
        return t('messages.info');
      case 'danger':
      default:
        return t('errors.error');
    }
  };

  return (
    <Alert
      variant={type}
      dismissible={!!onDismiss}
      onClose={onDismiss}
      className="error-alert"
    >
      <strong>{getAlertPrefix()}!</strong> {displayMessage}
    </Alert>
  );
};

export default ErrorAlert;

