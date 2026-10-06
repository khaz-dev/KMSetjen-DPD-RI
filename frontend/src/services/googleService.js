/**
 * Google OAuth 2.0 Service
 * Handles OAuth flow with Google identity provider
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';
const GOOGLE_SCOPES = 'profile email openid';

/**
 * Get app subpath for URL construction
 * @returns {string} App subpath (e.g., '/kms', '/', or '/kmsetjendpdri')
 */
const getAppSubpath = () => {
  const subpath = import.meta.env.VITE_APP_SUBPATH || '/';
  // Remove trailing slash for consistent URL construction
  return subpath.replace(/\/$/, '');
};

// Cache to prevent duplicate code exchanges (React StrictMode fix)
let pendingCodeExchange = null;
const exchangedCodes = new Set();

/**
 * Get Google OAuth authorization URL
 * @returns {string} Authorization URL
 */
export const getGoogleAuthorizationUrl = () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // Use explicit redirect URI from environment if set, otherwise construct from domain
  let redirectUri = GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    const appSubpath = getAppSubpath();
    // Must match exactly what's registered in Google Cloud Console
    // For localhost: registered as http://localhost:5175/google/callback/ (WITH slash)
    redirectUri = `${window.location.origin}${appSubpath}/google/callback/`;
  }
  
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
 * Exchange authorization code for tokens with retry logic
 * Handles transient failures and prevents duplicate exchanges (React StrictMode)
 * @param {string} code - Authorization code from Google
 * @param {string} state - State parameter for security
 * @param {string} redirectUri - Redirect URI used in authorization
 * @param {object} authService - Auth service instance
 * @param {number} attempt - Current retry attempt (internal)
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<object>} - Token exchange response
 */
const exchangeCodeWithRetry = async (
  code,
  state,
  redirectUri,
  authService,
  attempt = 1,
  maxRetries = 3
) => {
  // If code was already exchanged, return cached promise
  if (exchangedCodes.has(code)) {
    if (pendingCodeExchange) {
      return pendingCodeExchange;
    }
  }

  // Mark code as being exchanged and cache the promise
  exchangedCodes.add(code);

  try {
    const promise = authService.googleCallback(code, state, redirectUri);
    pendingCodeExchange = promise;
    
    const response = await promise;
    return response;
  } catch (error) {
    // Clear pending promise on error
    pendingCodeExchange = null;

    // Don't retry on invalid_grant (code was already used or invalid)
    if (error.response?.data?.error === 'invalid_grant') {
      console.warn('[GoogleService] invalid_grant error - code may have already been exchanged');
      throw error;
    }

    // Retry on transient errors (network issues, temporary server errors)
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return exchangeCodeWithRetry(
        code,
        state,
        redirectUri,
        authService,
        attempt + 1,
        maxRetries
      );
    }

    // All retries exhausted
    throw error;
  }
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

    // Exchange code for tokens via backend with retry logic
    // Note: Backend uses its configured redirect_uri (must match Google's registered URI)
    const appSubpath = getAppSubpath();
    const redirectUri = `${window.location.origin}${appSubpath}/google/callback/`;
    const response = await exchangeCodeWithRetry(code, state, redirectUri, authService);

    // Clear stored state and caches
    localStorage.removeItem('google_oauth_state');
    exchangedCodes.clear();
    pendingCodeExchange = null;

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
