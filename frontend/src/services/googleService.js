/**
 * Google OAuth 2.0 Service
 * Handles OAuth flow with Google identity provider
 */

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_SCOPES = 'profile email openid';

/**
 * Get Google OAuth authorization URL
 * @returns {string} Authorization URL
 */
export const getGoogleAuthorizationUrl = () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  const redirectUri = `${window.location.origin}/google/callback`;
  const state = generateRandomState();
  
  // Store state for verification (using localStorage for persistence across redirect)
  localStorage.setItem('google_oauth_state', state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    state: state,
    access_type: 'online',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Handle Google OAuth callback
 * @param {string} code - Authorization code from Google
 * @param {string} state - State parameter for security
 * @param {object} authService - Auth service instance
 * @returns {Promise<object>} - User data and tokens
 */
export const handleGoogleCallback = async (code, state, authService) => {
  try {
    // Verify state parameter
    const savedState = localStorage.getItem('google_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for tokens via backend
    // Note: Backend uses its configured redirect_uri (must match Google's registered URI)
    const response = await authService.googleCallback(code, state);

    // Clear stored state
    localStorage.removeItem('google_oauth_state');

    return response.data;
  } catch (error) {
    localStorage.removeItem('google_oauth_state');
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
 * Check if user is returning from Google callback
 * @returns {object} - Query parameters from URL
 */
export const getGoogleCallbackParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  };
};

/**
 * Check if Google Client ID is configured
 * @returns {boolean} - Whether Google login is available
 */
export const isGoogleConfigured = () => {
  return !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== '';
};
