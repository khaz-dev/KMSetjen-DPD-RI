import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleCallback, getGoogleCallbackParams } from '../services/googleService';
import { authService } from '../services/api';
import './AuthPages.css';

/**
 * Google OAuth Callback Page
 * Handles OAuth callback from Google
 */
const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode (development)
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const processGoogleCallback = async () => {
      try {
        const { code, state, error: callbackError, error_description } = getGoogleCallbackParams();

        // Check for errors from Google
        if (callbackError) {
          throw new Error(
            error_description || 
            t('google.error_from_provider', { error: callbackError })
          );
        }

        // Check for required parameters
        if (!code || !state) {
          throw new Error(t('google.invalid_callback_params'));
        }

        // Exchange code for tokens
        const response = await handleGoogleCallback(code, state, authService);

        // Store tokens
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        
        // Verify tokens by calling getMe() - this ensures tokens are valid and user is authenticated
        const meResponse = await authService.getMe();
        
        // Update AuthContext with user data - this triggers navbar update
        setAuthUser(meResponse.data);
        
        // Stop loading spinner so page content becomes visible
        setLoading(false);
        
        // Tokens are valid and user is authenticated, now redirect to home
        setTimeout(() => {
          navigate('/', { replace: true });
          // Also reload the page to ensure all components get auth state update
          window.location.href = '/';
        }, 500);
      } catch (err) {
        console.error('[GoogleCallback] Error:', err);
        const errorMsg = err.message || t('google.callback_failed');
        setError(errorMsg);
        setLoading(false);

        // Redirect to login after error display
        setTimeout(() => {
          navigate('/login');
        }, 5175);
      }
    };

    processGoogleCallback();
  }, [navigate, t, setAuthUser]);

  return (
    <div className="auth-page">
      <Container className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t('google.processing')}</h1>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">{t('messages.loading')}</span>
              </Spinner>
              <p>{t('google.please_wait')}</p>
            </div>
          )}

          {error && (
            <Alert variant="danger">
              <Alert.Heading>{t('messages.error')}</Alert.Heading>
              <p>{error}</p>
              <hr />
              <small>{t('google.redirecting_to_login')}</small>
            </Alert>
          )}
        </div>
      </Container>
    </div>
  );
};

export default GoogleCallbackPage;

