/**
 * SSO (Single Sign-On) Service
 * Handles OAuth flow with external SSO provider (nusadpd.duckdns.org)
 */

const SSO_PROVIDER_URL = import.meta.env.VITE_SSO_URL || 'https://nusadpd.duckdns.org';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'kms-dpd-ri';
const REDIRECT_URI = `${window.location.origin}/sso/callback`;

/**
 * Get authorization URL for redirecting user to SSO provider
 * @returns {string} Authorization URL
 */
export const getSSOAuthorizationUrl = () => {
  const state = generateRandomState();
  sessionStorage.setItem('sso_state', state);
  
  const params = new URLSearchParams({
    client_id: SSO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state: state,
  });

  return `${SSO_PROVIDER_URL}/oauth/authorize?${params.toString()}`;
};

/**
 * Handle SSO callback - exchange authorization code for tokens
 * @param {string} code - Authorization code from SSO provider
 * @param {string} state - State parameter for security
 * @returns {Promise<object>} - User data and tokens
 */
export const handleSSOCallback = async (code, state, authService) => {
  try {
    // Verify state parameter
    const savedState = sessionStorage.getItem('sso_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for tokens via backend
    const response = await authService.ssoCallback(code, state, REDIRECT_URI);
    
    // Clear stored state
    sessionStorage.removeItem('sso_state');
    
    return response.data;
  } catch (error) {
    sessionStorage.removeItem('sso_state');
    throw error;
  }
};

/**
 * Generate random state for CSRF protection
 * @returns {string} Random state string
 */
const generateRandomState = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let state = '';
  for (let i = 0; i < 32; i++) {
    state += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return state;
};

/**
 * Check if user is returning from SSO callback
 * @returns {object} - Query parameters from URL
 */
export const getCallbackParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  };
};
