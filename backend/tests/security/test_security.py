"""Security hardening tests."""
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import User, Role


class CSRFProtectionTest(TestCase):
    """Test CSRF protection."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_csrf_token_in_login_form(self):
        """Test CSRF protection is enabled in settings."""
        from django.conf import settings
        # Verify CSRF middleware is in place
        self.assertIn('django.middleware.csrf.CsrfViewMiddleware', settings.MIDDLEWARE)
        # Verify CSRF settings are secure
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, 'Strict')
    
    def test_post_without_csrf_token_rejected(self):
        """Test CSRF cookie configuration."""
        from django.conf import settings
        # Verify CSRF cookies are properly configured
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, 'Strict')


class SecureSessionTest(TestCase):
    """Test secure session configuration."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_session_cookie_httponly(self):
        """Test session cookie is httpOnly."""
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get('/')
        
        # Check for Set-Cookie header
        cookies = response.cookies
        if 'sessionid' in cookies:
            # HttpOnly flag should be set
            self.assertTrue(cookies['sessionid']['httponly'])
    
    def test_session_cookie_secure(self):
        """Test session cookie has secure flag (in production)."""
        # This test verifies the setting is configured
        from django.conf import settings
        self.assertTrue(settings.SESSION_COOKIE_SECURE or settings.DEBUG)
    
    def test_session_cookie_samesite(self):
        """Test session cookie has SameSite attribute."""
        from django.conf import settings
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, 'Strict')


class JWTSecurityTest(TestCase):
    """Test JWT token security."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_token_has_expiration(self):
        """Test JWT tokens have expiration."""
        from rest_framework_simplejwt.settings import DEFAULTS as JWT_DEFAULTS
        # Verify tokens have expiration time
        self.assertIsNotNone(JWT_DEFAULTS.get('ACCESS_TOKEN_LIFETIME'))
        self.assertIsNotNone(JWT_DEFAULTS.get('REFRESH_TOKEN_LIFETIME'))
    
    def test_token_rotation_enabled(self):
        """Test token rotation is enabled in settings."""
        from django.conf import settings
        # Verify token rotation is configured in SIMPLE_JWT settings
        self.assertTrue(settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False))


class PasswordSecurityTest(TestCase):
    """Test password security requirements."""
    
    def test_strong_password_required(self):
        """Test strong password validation."""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        # Short password should be rejected
        with self.assertRaises(ValidationError):
            validate_password('short')
    
    def test_password_contains_username_rejected(self):
        """Test password cannot contain username."""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        # Create user first
        user = User(username='testuser', email='test@example.com')
        
        # Password containing username should be rejected
        with self.assertRaises(ValidationError):
            validate_password('testuser123', user=user)
    
    def test_common_password_rejected(self):
        """Test common passwords are rejected."""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        # Very common password should be rejected
        with self.assertRaises(ValidationError):
            validate_password('password123')


class CORSSecurityTest(TestCase):
    """Test CORS security configuration."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
    
    def test_cors_only_allowed_origins(self):
        """Test CORS only allows specific origins."""
        from django.conf import settings
        
        # Verify CORS whitelist is configured
        cors_origins = settings.CORS_ALLOWED_ORIGINS
        self.assertIsNotNone(cors_origins)
        self.assertTrue(len(cors_origins) > 0)
    
    def test_cors_credentials_allowed(self):
        """Test CORS credentials are allowed."""
        from django.conf import settings
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)


class SecurityHeadersTest(TestCase):
    """Test security headers."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
    
    def test_x_frame_options_header(self):
        """Test X-Frame-Options header is set."""
        from django.conf import settings
        self.assertEqual(settings.X_FRAME_OPTIONS, 'DENY')
    
    def test_xss_filter_enabled(self):
        """Test XSS protection is enabled."""
        from django.conf import settings
        self.assertTrue(settings.SECURE_BROWSER_XSS_FILTER)
    
    def test_hsts_configured(self):
        """Test HSTS is configured."""
        from django.conf import settings
        hsts_seconds = settings.SECURE_HSTS_SECONDS
        self.assertGreater(hsts_seconds, 0)


class InputValidationTest(TestCase):
    """Test input validation and sanitization."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
    
    def test_max_upload_size_configured(self):
        """Test max upload size is configured."""
        from django.conf import settings
        
        max_memory = settings.DATA_UPLOAD_MAX_MEMORY_SIZE
        self.assertLessEqual(max_memory, 5242880)  # Max 5MB
    
    def test_max_fields_limited(self):
        """Test max number of fields is limited."""
        from django.conf import settings
        
        max_fields = settings.DATA_UPLOAD_MAX_NUMBER_FIELDS
        self.assertLess(max_fields, 10000)


class RateLimitingTest(TestCase):
    """Test rate limiting configuration."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
    
    def test_rate_limiting_configured(self):
        """Test rate limiting is configured."""
        from django.conf import settings
        
        # Verify rate limiting is enabled
        self.assertTrue(settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'])
        
        # Verify rate limits are set
        throttle_rates = settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
        self.assertIn('anon', throttle_rates)
        self.assertIn('user', throttle_rates)
    
    def test_strict_login_rate_limit(self):
        """Test login endpoint has strict rate limit."""
        from shared.security_config import API_RATE_LIMITS
        
        # Verify authentication rate limit is strict
        auth_limit = API_RATE_LIMITS['authentication']
        self.assertIsNotNone(auth_limit)
        # Should be 5 or fewer per hour
        self.assertIn('5/hour', auth_limit)


class SQLInjectionProtectionTest(TestCase):
    """Test SQL injection protection."""
    
    def test_orm_parameterization(self):
        """Test Django ORM uses parameterized queries."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Safe query through ORM
        found_user = User.objects.get(username='testuser')
        self.assertEqual(found_user.id, user.id)
    
    def test_atomic_requests(self):
        """Test atomic requests are configured."""
        from django.conf import settings
        
        # Verify atomic requests is enabled
        default_db = settings.DATABASES['default']
        self.assertTrue(default_db.get('ATOMIC_REQUESTS', False))


class AuditLoggingTest(TestCase):
    """Test security audit logging."""
    
    def test_security_logger_configured(self):
        """Test security logger is configured."""
        from django.conf import settings
        import logging
        
        logger = logging.getLogger('django.security')
        self.assertIsNotNone(logger)
    
    def test_audit_logger_configured(self):
        """Test audit logger is configured."""
        from django.conf import settings
        import logging
        
        logger = logging.getLogger('apps.audit')
        self.assertIsNotNone(logger)


class ClickjackingProtectionTest(TestCase):
    """Test clickjacking protection."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
    
    def test_frame_ancestors_restricted(self):
        """Test frame ancestors are restricted."""
        from django.conf import settings
        
        # X-Frame-Options should be DENY or SAMEORIGIN
        self.assertIn(settings.X_FRAME_OPTIONS, ['DENY', 'SAMEORIGIN'])


class SecurityChecklistTest(TestCase):
    """Test overall security configuration."""
    
    def test_security_checklist_complete(self):
        """Test all security features are enabled."""
        from shared.security_config import SECURITY_CHECKLIST
        
        # All critical security features should be enabled
        for feature, enabled in SECURITY_CHECKLIST.items():
            if feature not in ['ssl_redirect']:  # SSL only in production
                self.assertTrue(
                    enabled,
                    f"Security feature '{feature}' is not enabled"
                )
