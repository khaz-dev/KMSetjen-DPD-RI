"""
Django settings for KMSetjen DPD RI project.

Generated on: 5 Januari 2026
"""

import os
from pathlib import Path
from datetime import timedelta
import environ
import logging.config

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================
# settings.py is at: backend/config/settings.py
# In local development: __file__.parent.parent.parent = project_root
# In Docker (build context ./backend): __file__.parent.parent = /app
# We detect Docker by checking the parent directory structure
_settings_file = Path(__file__).resolve()
_parent_parent = _settings_file.parent.parent  # backend or /app

# Check if parent folder is named 'backend' to determine environment
if _parent_parent.name == 'backend':
    # Local development: config is inside backend folder
    BASE_DIR = _parent_parent.parent  # Go up to project root
else:
    # Docker: config is directly inside /app (no backend folder)
    BASE_DIR = _parent_parent

# Initialize environment
env = environ.Env()
# Try to load .env from BASE_DIR first, then from parent
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)
else:
    # In Docker container, .env may not be copied into image,
    # but should be available from docker-compose env_file or environment variables
    # So we just continue without it - the values will come from docker-compose
    pass

# ============================================================================
# SECURITY
# ============================================================================
SECRET_KEY = env('SECRET_KEY', default='unsafe-dev-key-change-in-prod')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'testserver'])

# ============================================================================
# DJANGO APPS
# ============================================================================
# IMPORTANT: apps.core must come before django.contrib.staticfiles
# so that our custom runserver command takes precedence
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'django_filters',
    'django_extensions',
]

LOCAL_APPS = [
    'apps.core',  # Must come before staticfiles so runserver command is prioritized
    'apps.content',
    'apps.auth',
    'apps.audit',
    'apps.api',
]

DJANGO_APPS_AFTER_LOCAL = [
    'django.contrib.staticfiles',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + DJANGO_APPS_AFTER_LOCAL

# ============================================================================
# MIDDLEWARE
# ============================================================================
MIDDLEWARE = [
    # ScriptNameMiddleware MUST be first to set SCRIPT_NAME from proxy header
    # This is critical for correct URL generation when behind a reverse proxy with /kms prefix
    'shared.middleware.proxy_middleware.ScriptNameMiddleware',
    # SecurityMiddleware causes unwanted HTTPS redirect even with SECURE_SSL_REDIRECT=False  
    # Only enable in production
    'shared.middleware.debug_middleware.DebugSettingsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'shared.middleware.security_middleware.RateLimitMiddleware',
    'shared.middleware.security_middleware.InputSanitizationMiddleware',
    'shared.middleware.security_middleware.SecurityAuditMiddleware',
    'shared.middleware.security_middleware.FilePreviewMiddleware',  # MUST be last to override headers on responses
]

# Add SecurityMiddleware only in production (DEBUG=False causes HTTPS redirects)
if not DEBUG:
    MIDDLEWARE.insert(0, 'django.middleware.security.SecurityMiddleware')

# ============================================================================
# ROOT CONFIGURATION
# ============================================================================
ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ============================================================================
# DATABASE
# ============================================================================
DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': env('DB_NAME', default='kmsdb'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='Okkdpdri@2026'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 0,  # Disable persistent connections
        'OPTIONS': {
            'connect_timeout': 10,
        },
        'ATOMIC_REQUESTS': True,
    }
}

# ============================================================================
# AUTHENTICATION & AUTH USER
# ============================================================================
AUTH_USER_MODEL = 'core.User'

# Login settings for Django admin
# Note: These will be rewritten by middleware for subpath support
LOGIN_URL = 'admin:login'
LOGIN_REDIRECT_URL = 'admin:index'
LOGOUT_REDIRECT_URL = 'admin:login'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================================
# REST FRAMEWORK
# ============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',  # Increased for development
        'user': '10000/hour',  # Increased for development
    },
    'EXCEPTION_HANDLER': 'shared.exceptions.custom_exception_handler',
}

# ============================================================================
# CORS
# ============================================================================
# (Moved to Security Settings section for consolidated configuration)

# ============================================================================
# STATIC & MEDIA FILES
# ============================================================================
# Support both root (/) and subpath (/kmsetjendpdri/) deployment
# For development (localhost): Don't use subpath
# For production/staging: Use subpath /kmsetjendpdri
ENVIRONMENT = env('ENVIRONMENT', default='development')
app_subpath = env('APP_SUBPATH', default='')  # Get subpath from environment

# STATIC_URL should NOT include subpath - it's for Django's internal file serving
# WhiteNoise and Django will serve files from this path
STATIC_URL = '/static/'
MEDIA_URL = '/media/'

# Store subpath for template rendering and URL generation
APP_SUBPATH = app_subpath

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ============================================================================
# INTERNATIONALIZATION
# ============================================================================
LANGUAGE_CODE = 'id-ID'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

# ============================================================================
# LOGGING
# ============================================================================
# Create logs directory if it doesn't exist
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'audit.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': env('LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ============================================================================
# REDIS & CACHE
# ============================================================================
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# ============================================================================
# CELERY (OPTIONAL)
# ============================================================================
CELERY_BROKER_URL = env('REDIS_URL', default='redis://127.0.0.1:6382/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://127.0.0.1:6382/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# ============================================================================
# EMAIL
# ============================================================================
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('EMAIL_HOST_USER', default='noreply@kms.example.com')

# ============================================================================
# SSO CONFIGURATION
# ============================================================================
SSO_ENABLED = env.bool('SSO_ENABLED', default=False)
SSO_URL = env('SSO_URL', default='https://sso.server.com')
SSO_CALLBACK_URL = env('SSO_CALLBACK_URL', default='http://localhost:8002/api/auth/sso/callback')

# ============================================================================
# GOOGLE OAUTH CONFIGURATION
# ============================================================================
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/kms/google/callback/')

# ============================================================================
# GOOGLE RECAPTCHA CONFIGURATION
# ============================================================================
RECAPTCHA_SECRET_KEY = env('RECAPTCHA_SECRET_KEY', default='')
ENABLE_CAPTCHA = env.bool('ENABLE_CAPTCHA', default=False)

# ============================================================================
# DEFAULT AUTO FIELD
# ============================================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# SECURITY SETTINGS (Comprehensive Hardening)
# ============================================================================
# CSRF Protection
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'  # Changed to Lax for better SPA compatibility
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=[
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost',
        'https://127.0.0.1',
        'https://khaz.app',
        'https://www.khaz.app',
    ]
)
CSRF_COOKIE_AGE = 31449600  # 1 year

# Session Security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# JWT Token Settings (Enhanced)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=int(env('JWT_ACCESS_TOKEN_LIFETIME_HOURS', default=1))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(env('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7))),
    'ALGORITHM': env('JWT_ALGORITHM', default='HS256'),
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_SECURE': True,
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SAMESITE': 'Strict',
}

# Security Headers
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = not DEBUG  # Disabled in development (DEBUG=True), enabled in production (DEBUG=False)
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'"),
    'style-src': ("'self'", "'unsafe-inline'"),
    'img-src': ("'self'", 'data:', 'https:'),
    'font-src': ("'self'",),
    'connect-src': ("'self'",),
    'frame-ancestors': ("'none'",),
}
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY_REPORT_ONLY = False
# Allow framing for file preview endpoints (same origin)
# This is necessary for PDF/image previews in iframes within the editor
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Password Security
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {
            'user_attributes': ['username', 'first_name', 'last_name', 'email'],
            'max_similarity': 0.7
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Input Validation & File Upload Limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Atomic Requests DISABLED - we use explicit transaction.atomic() in views
# to avoid holding database locks during external HTTP API calls
# DATABASES['default']['ATOMIC_REQUESTS'] = False

# CORS Configuration (Origin-based Access Control)
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=[
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'https://kms.dpd.go.id',
        'https://kms-be.dpd.go.id',
        'https://khaz.app',
        'https://www.khaz.app',
    ]
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-CSRFToken',
    'X-Total-Count',
    'X-Page-Number',
]
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

# Security Audit Logging
SECURITY_AUDIT_LOG_FILE = os.path.join(LOGS_DIR, 'security_audit.log')
SECURITY_AUDIT_ENABLED = True

# Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    'ENABLED': True,
    'LOGIN_ATTEMPTS': 5,
    'LOGIN_ATTEMPTS_PERIOD': 3600,  # 1 hour
    'REGISTRATION_ATTEMPTS': 3,
    'REGISTRATION_ATTEMPTS_PERIOD': 86400,  # 1 day
    'API_RATE_LIMIT': 100,
    'API_RATE_LIMIT_PERIOD': 3600,  # 1 hour
    'CACHE_BACKEND': 'default',
}

# Production-only security hardening
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# External API Configuration
EXTERNAL_API_BASE_URL = env('EXTERNAL_API_BASE_URL', default='https://Cmb2.duckdns.org')
EXTERNAL_API_TOKEN = env('EXTERNAL_API_TOKEN', default='hY89aCK6tgMmGQNootpLYsw9otfwmNAv24cZ3QIljC8aI8DQ4RbxQlHPn0cVBbgdtwuJpWbxfbu4qGCwTycKtAiIDwX8ePEcWRtBhu2LfKmsY87eGuCDXBv8pAvbLtEH')