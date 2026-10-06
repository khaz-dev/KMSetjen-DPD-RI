import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authService, publicClient } from '../services/api';
import './AuthPages.css';

/**
 * SSO Token Handler Page
 * Handles direct JWT token from SSO provider via URL path
 * URL: /sso/:token
 * 
 * Flow:
 * 1. Extract token from URL parameter
 * 2. Send token to backend for verification and JWT generation
 * 3. Backend validates SSO token and returns Django JWT tokens
 * 4. Store Django JWT tokens in localStorage
 * 5. Redirect to dashboard
 */
const SSOTokenPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { t } = useTranslation();
  const { setAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processSSOToken = async () => {
      try {
        if (!token) {
          throw new Error(t('sso.invalid_callback_params'));
        }

        // Send the SSO provider token to the backend for verification
        const tokenResponse = await publicClient.post('/auth/sso/token/', {
          token: token
        });
        
        // Store the Django JWT tokens in localStorage
        const { access, refresh, user } = tokenResponse.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        // Update AuthContext with user data - this triggers navbar update
        setAuthUser(user);
        
        // Stop loading spinner so page content becomes visible
        setLoading(false);
        
        // Redirect to home page and reload to ensure navbar updates
        setTimeout(() => {
          navigate('/', { replace: true });
          // Also reload the page to ensure all components get auth state update
          window.location.href = '/';
        }, 500);
      } catch (err) {
        console.error('[SSOToken] Error:', err);
        
        // Extract meaningful error message
        let errorMsg = t('sso.callback_failed');
        if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        console.error('[SSOToken] Error details:', {
          status: err.response?.status,
          error: err.response?.data?.error,
          message: errorMsg
        });
        
        setError(errorMsg);
        setLoading(false);
        
        // Redirect to login after error display
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    };

    processSSOToken();
  }, [token, navigate, t, setAuthUser]);

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

export default SSOTokenPage;

