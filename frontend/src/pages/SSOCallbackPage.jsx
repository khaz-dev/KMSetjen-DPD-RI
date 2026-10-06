import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { handleSSOCallback, getCallbackParams } from '../services/ssoService';
import { authService } from '../services/api';
import './AuthPages.css';

/**
 * SSO Callback Page
 * Handles OAuth callback from SSO provider
 */
const SSOCallbackPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processSSOCallback = async () => {
      try {
        const { code, state, error: callbackError, error_description } = getCallbackParams();

        // Check for errors from SSO provider
        if (callbackError) {
          throw new Error(
            error_description || 
            t('sso.error_from_provider', { error: callbackError })
          );
        }

        // Check for required parameters
        if (!code || !state) {
          throw new Error(t('sso.invalid_callback_params'));
        }

        // Exchange code for tokens
        const response = await handleSSOCallback(code, state, authService);
        
        // Store tokens
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);

        // Verify tokens by calling getMe() - this ensures tokens are valid and user is authenticated
        const meResponse = await authService.getMe();
        
        // Tokens are valid and user is authenticated, now redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } catch (err) {
        console.error('[SSOCallback] Error:', err);
        const errorMsg = err.message || t('sso.callback_failed');
        setError(errorMsg);
        setLoading(false);
        
        // Redirect to login after error display
        setTimeout(() => {
          navigate('/login');
        }, 5175);
      }
    };

    processSSOCallback();
  }, [navigate, t]);

  return (
    <div className="auth-page">
      <Container className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t('sso.processing')}</h1>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">{t('messages.loading')}</span>
              </Spinner>
              <p>{t('sso.please_wait')}</p>
            </div>
          )}

          {error && (
            <Alert variant="danger">
              <Alert.Heading>{t('messages.error')}</Alert.Heading>
              <p>{error}</p>
              <hr />
              <small>{t('sso.redirecting_to_login')}</small>
            </Alert>
          )}
        </div>
      </Container>
    </div>
  );
};

export default SSOCallbackPage;

