import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';

// Extract backend base URL (e.g., http://localhost:8002)
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Convert relative media URL to absolute URL
 * @param {string} mediaUrl - Relative or absolute media URL
 * @returns {string} Absolute media URL with backend domain
 */
export const getAbsoluteMediaUrl = (mediaUrl) => {
  if (!mediaUrl) return null;
  // If already absolute URL, return as-is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl;
  }
  // If relative URL, prepend backend base URL
  return BACKEND_BASE_URL + mediaUrl;
};

// Suppress 404 console errors for internal article GET requests
// This is expected behavior for non-staff users accessing articles they don't own
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorText = args.map(arg => String(arg)).join(' ');
  
  // Check if this is a 404 error for internal articles
  if (errorText.includes('404') && errorText.includes('/v1/internal/articles/')) {
    // Silently suppress this expected error
    return;
  }
  
  // Log all other errors normally
  return originalConsoleError.apply(console, args);
};

// Create axios instance for AUTHENTICATED requests (with JWT token)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 51750, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Default validation - 2xx and 3xx are success, everything else is error
  validateStatus: (status) => status >= 200 && status < 300,
});

// Custom params serializer for django-filter compatibility
// Converts array params to repeated params: tags=1&tags=2&tags=3 instead of tags=1,2,3
const customParamsSerializer = (params) => {
  const parts = [];
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    
    // Handle array parameters - repeat the key for each value
    if (Array.isArray(value)) {
      value.forEach(item => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      });
    } else if (value !== null && value !== undefined && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  
  return parts.join('&');
};

// Create axios instance for PUBLIC requests (no JWT token)
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 51750, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: customParamsSerializer,
});

// Add request interceptor to handle token and suppress 404 logging for internal articles
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CRITICAL FIX: For FormData uploads, delete Content-Type header so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // For internal article GET requests, allow 404 responses so axios doesn't log them as errors
    if (config.url?.includes('/v1/internal/articles/') && config.method?.toLowerCase() === 'get') {
      config.validateStatus = (status) => status < 500; // Accept anything below 500 (2xx, 3xx, 4xx all OK)
      config.suppressErrorLog = true;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add optional authorization header to public client (for authenticated users accessing public endpoints)
// This allows authenticated users to see internal articles when filtering
publicClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors for publicClient (token refresh retry logic)
publicClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401: attempt token refresh and retry
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return publicClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed from publicClient:', refreshError.response?.status);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }

    return Promise.reject(error);
  }
);

// Handle response and convert 404s on internal articles to rejections (without logging)
apiClient.interceptors.response.use(
  (response) => {
    // Check if this is a 404 response that was allowed through by validateStatus
    if (response.status === 404 && response.config?.suppressErrorLog) {
      // Convert to rejection without logging (validateStatus prevented axios logging)
      const error = new Error(`Request failed with status code 404`);
      error.response = response;
      error.config = response.config;
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } else {
          // No refresh token available, treat as authentication failure
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Only redirect if not already on login page or auth-related endpoints
          if (window.location.pathname !== '/login' && !originalRequest.url.includes('/auth/')) {
            window.location.href = '/login';
          }
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError.response?.status, refreshError.message);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Only redirect if not already on login page or auth-related endpoints
        if (window.location.pathname !== '/login' && !originalRequest.url.includes('/auth/')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Authentication Service
export const authService = {
  login: function(emailOrCreds, password) {
    // Support both old signature (username, password) and new signature (object)
    if (typeof emailOrCreds === 'string') {
      // Old signature: login(username, password)
      return apiClient.post('/auth/token/', { username: emailOrCreds, password });
    } else {
      // New signature: login({ email, password, captcha_token })
      return apiClient.post('/auth/token/', emailOrCreds);
    }
  },
  
  getMe: () =>
    apiClient.get('/auth/me/'),
  
  updateProfile: (data) =>
    apiClient.post('/auth/update-profile/', data),
  
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  
  logout: () =>
    apiClient.post('/auth/logout/'),

  // User Activity
  getUserActivity: () =>
    apiClient.get('/auth/me/activity/'),

  // SSO endpoints
  ssoCallback: (code, state, redirectUri) =>
    publicClient.post('/auth/sso/callback/', {
      code,
      state,
      redirect_uri: redirectUri,
    }),

  // Google OAuth endpoints (use publicClient to avoid Bearer token)
  googleCallback: (code, state, redirectUri) =>
    publicClient.post('/auth/google/callback/', {
      code,
      state,
      redirect_uri: redirectUri,
    }),
};

// Public API Service (uses publicClient without authentication)
export const publicAPI = {
  // Articles
  getArticles: (params) =>
    publicClient.get('/v1/public/articles/', { params }),
  
  getArticle: (id) =>
    publicClient.get(`/v1/public/articles/${id}/`),
  
  searchArticles: (query) =>
    publicClient.get('/v1/public/articles/search/', { params: { search: query } }),
  
  getPopularArticles: () =>
    publicClient.get('/v1/public/articles/popular/'),
  
  // Categories
  getCategories: (params) =>
    publicClient.get('/v1/public/categories/', { params }),
  
  getCategory: (id) =>
    publicClient.get(`/v1/public/categories/${id}/`),
  
  // Tags
  getTags: (params) =>
    publicClient.get('/v1/public/tags/', { params }),
  
  getTag: (id) =>
    publicClient.get(`/v1/public/tags/${id}/`),

  // View tracking
  recordView: (id) =>
    publicClient.post(`/v1/public/articles/${id}/view/`),

  // Like tracking
  recordLike: (id) =>
    publicClient.post(`/v1/public/articles/${id}/like/`),
};

// Internal API Service (Authenticated)
export const internalAPI = {
  // Articles - CRUD
  getMyArticles: (params) =>
    apiClient.get('/v1/internal/articles/', { params }),
  
  createArticle: (data) =>
    apiClient.post('/v1/internal/articles/', data),
  
  getArticle: (id) =>
    apiClient.get(`/v1/internal/articles/${id}/`),
  
  updateArticle: (id, data) =>
    apiClient.patch(`/v1/internal/articles/${id}/`, data),
  
  deleteArticle: (id) =>
    apiClient.delete(`/v1/internal/articles/${id}/`),
  
  // Article Workflow
  submitReview: (id, data) =>
    apiClient.post(`/v1/internal/articles/${id}/submit-review/`, data),
  
  approveArticle: (id) =>
    apiClient.post(`/v1/internal/articles/${id}/approve/`),
  
  publishArticle: (id) =>
    apiClient.post(`/v1/internal/articles/${id}/publish/`),
  
  rejectArticle: (id, data) =>
    apiClient.post(`/v1/internal/articles/${id}/reject/`, data),
  
  archiveArticle: (id) =>
    apiClient.post(`/v1/internal/articles/${id}/archive/`),
  
  // Creator Suggestions
  searchInternalCreators: (query = '') =>
    apiClient.get('/v1/internal/articles/creators-internal/', { params: { q: query } }),

  searchExternalCreators: (query = '') =>
    apiClient.get('/v1/internal/articles/creators-external/', { params: { q: query } }),

  // Slug Validation
  checkSlug: (slug, excludeId = null, versionType = 'draft') => {
    const params = { slug, version_type: versionType };
    // IMPORTANT: Only add exclude_id if it's a valid positive integer
    // This ensures we exclude the current article when editing
    // Using typeof check to handle 0, which is falsy but still a valid ID
    if (excludeId && typeof excludeId === 'number' && excludeId > 0) {
      params.exclude_id = excludeId;
    } else if (excludeId !== null && excludeId !== undefined && String(excludeId).match(/^\d+$/)) {
      // Also handle string IDs that are numeric
      params.exclude_id = String(excludeId);
    }
    return apiClient.get('/v1/internal/articles/check-slug/', { params });
  },

  // File Management
  uploadFile: (articleId, file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('original_filename', file.name);
    formData.append('description_en', description);
    formData.append('description_id', description);
    return apiClient.post(`/v1/internal/articles/${articleId}/files/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getArticleFiles: (articleId) =>
    apiClient.get(`/v1/internal/articles/${articleId}/files/`),

  updateFile: (articleId, fileId, data) =>
    apiClient.patch(`/v1/internal/articles/${articleId}/files/${fileId}/`, data),

  deleteFile: (articleId, fileId) =>
    apiClient.delete(`/v1/internal/articles/${articleId}/files/${fileId}/`),

  reorderFiles: (articleId, fileIds) =>
    apiClient.post(`/v1/internal/articles/${articleId}/files/reorder/`, { file_ids: fileIds }),

  // Dashboard
  getDashboard: () =>
    apiClient.get('/v1/internal/articles/dashboard/'),
};

// Admin API Service (Admin-Only)
export const adminAPI = {
  // Users
  getUsers: (params) =>
    apiClient.get('/v1/admin/users/', { params }),
  
  createUser: (data) =>
    apiClient.post('/v1/admin/users/', data),
  
  getUser: (id) =>
    apiClient.get(`/v1/admin/users/${id}/`),
  
  updateUser: (id, data) =>
    apiClient.patch(`/v1/admin/users/${id}/`, data),
  
  deleteUser: (id) =>
    apiClient.delete(`/v1/admin/users/${id}/`),
  
  setUserPassword: (id, password) =>
    apiClient.post(`/v1/admin/users/${id}/set-password/`, {
      password,
      password_confirm: password,
    }),
  
  activateUser: (id) =>
    apiClient.post(`/v1/admin/users/${id}/activate/`),
  
  deactivateUser: (id) =>
    apiClient.post(`/v1/admin/users/${id}/deactivate/`),
  
  syncExternalUsers: () =>
    apiClient.post('/v1/admin/users/sync-external-users/', {}),
  
  // Roles
  getRoles: (params) =>
    apiClient.get('/v1/admin/roles/', { params }),
  
  createRole: (data) =>
    apiClient.post('/v1/admin/roles/', data),
  
  getRole: (id) =>
    apiClient.get(`/v1/admin/roles/${id}/`),
  
  updateRole: (id, data) =>
    apiClient.patch(`/v1/admin/roles/${id}/`, data),
  
  deleteRole: (id) =>
    apiClient.delete(`/v1/admin/roles/${id}/`),
  
  addPermissionToRole: (id, permissionId) =>
    apiClient.post(`/v1/admin/roles/${id}/add-permission/`, {
      permission_id: permissionId,
    }),
  
  removePermissionFromRole: (id, permissionId) =>
    apiClient.post(`/v1/admin/roles/${id}/remove-permission/`, {
      permission_id: permissionId,
    }),
  
  // Permissions
  getPermissions: (params) =>
    apiClient.get('/v1/admin/permissions/', { params }),
  
  // Audit Logs
  getAuditLogs: (params) =>
    apiClient.get('/v1/admin/audit-logs/', { params }),
  
  filterAuditLogs: (filters) =>
    apiClient.post('/v1/admin/audit-logs/filter/', filters),
  
  // Statistics
  getStatistics: () =>
    apiClient.get('/v1/admin/statistics/'),
  
  getUserStats: () =>
    apiClient.get('/v1/admin/statistics/users/'),
  
  getArticleStats: () =>
    apiClient.get('/v1/admin/statistics/articles/'),
  
  getAuditStats: () =>
    apiClient.get('/v1/admin/statistics/audit/'),
};

/**
 * Helper function to generate article URL
 * Prefers slug if available, falls back to ID
 * @param {Object} article - Article object with id and slug
 * @returns {string} URL path for the article
 */
export const getArticleUrl = (article) => {
  if (!article) return '/knowledges';
  // Prefer slug if available, otherwise use ID
  const identifier = article.slug || article.id;
  return `/knowledges/${identifier}`;
};

export default apiClient;
export { publicClient };
