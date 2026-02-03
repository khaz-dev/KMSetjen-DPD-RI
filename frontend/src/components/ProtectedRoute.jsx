import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading.loading')}</span>
        </Spinner>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    // roles is an array of strings like ['admin', 'editor', 'contributor']
    // Check if any role (case-insensitive) matches the required role
    const hasRole = user?.roles?.some(
      role => (typeof role === 'string' ? role : role.code)?.toUpperCase() === requiredRole.toUpperCase()
    );
    if (!hasRole) {
      return <Navigate to="/403" />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading.loading')}</span>
        </Spinner>
      </div>
    );
  }

  return children;
};

