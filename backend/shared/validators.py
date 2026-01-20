"""API security validators and input sanitization."""
import re
import logging
from django.core.exceptions import ValidationError
from django.utils.html import escape

logger = logging.getLogger('django.security')


class SecurityValidator:
    """Base class for security validators."""
    
    @staticmethod
    def validate_not_empty(value, field_name='input'):
        """Validate input is not empty."""
        if not value or not str(value).strip():
            raise ValidationError(f'{field_name} cannot be empty.')
    
    @staticmethod
    def validate_length(value, min_length=1, max_length=255, field_name='input'):
        """Validate input length."""
        length = len(str(value))
        if length < min_length:
            raise ValidationError(
                f'{field_name} must be at least {min_length} characters long.'
            )
        if length > max_length:
            raise ValidationError(
                f'{field_name} cannot exceed {max_length} characters.'
            )
    
    @staticmethod
    def validate_no_sql_injection(value):
        """Validate input doesn't contain SQL injection attempts."""
        dangerous_sql_patterns = [
            r"['\"]\s*OR\s*['\"]",
            r"['\"]\s*AND\s*['\"]",
            r"DROP\s+TABLE",
            r"DELETE\s+FROM",
            r"INSERT\s+INTO",
            r"UPDATE\s+SET",
            r"UNION\s+SELECT",
            r"EXEC\s*\(",
            r"SCRIPT",
        ]
        
        value_upper = str(value).upper()
        for pattern in dangerous_sql_patterns:
            if re.search(pattern, value_upper):
                logger.warning(f'SQL injection attempt detected: {value[:50]}')
                raise ValidationError(
                    'Invalid input detected. SQL injection attempts are not allowed.'
                )
    
    @staticmethod
    def validate_no_xss(value):
        """Validate input doesn't contain XSS attempts."""
        dangerous_xss_patterns = [
            r'<\s*script',
            r'javascript\s*:',
            r'on\w+\s*=',
            r'<\s*iframe',
            r'<\s*object',
            r'<\s*embed',
        ]
        
        value_lower = str(value).lower()
        for pattern in dangerous_xss_patterns:
            if re.search(pattern, value_lower):
                logger.warning(f'XSS attempt detected: {value[:50]}')
                raise ValidationError(
                    'Invalid input detected. HTML/Script tags are not allowed.'
                )
    
    @staticmethod
    def validate_email(email):
        """Validate email format and security."""
        # RFC 5322 simplified
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(pattern, email):
            raise ValidationError('Invalid email format.')
        
        if len(email) > 254:
            raise ValidationError('Email address is too long.')
        
        # Check for SQL injection patterns
        SecurityValidator.validate_no_sql_injection(email)
    
    @staticmethod
    def validate_username(username):
        """Validate username format and security."""
        # Only alphanumeric, underscore, and hyphen
        pattern = r'^[a-zA-Z0-9_-]+$'
        
        if not re.match(pattern, username):
            raise ValidationError(
                'Username can only contain letters, numbers, underscores, and hyphens.'
            )
        
        if len(username) < 3:
            raise ValidationError('Username must be at least 3 characters long.')
        
        if len(username) > 150:
            raise ValidationError('Username cannot exceed 150 characters.')
        
        # Check for SQL injection
        SecurityValidator.validate_no_sql_injection(username)
    
    @staticmethod
    def validate_password_strength(password, username=None):
        """Validate password strength."""
        if len(password) < 12:
            raise ValidationError(
                'Password must be at least 12 characters long.'
            )
        
        # Check for variety
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
        
        if not (has_upper and has_lower and has_digit):
            raise ValidationError(
                'Password must contain uppercase, lowercase, and number.'
            )
        
        # Check if password is too similar to username
        if username and username.lower() in password.lower():
            raise ValidationError(
                'Password cannot contain username.'
            )
        
        # Check common patterns
        common_patterns = [
            '123456', 'password', 'qwerty', 'abc123',
            'letmein', 'welcome', 'monkey', '1234567890'
        ]
        
        for pattern in common_patterns:
            if pattern in password.lower():
                raise ValidationError(
                    'Password is too common. Please choose a stronger password.'
                )
    
    @staticmethod
    def sanitize_text(text, max_length=1000):
        """Sanitize text input."""
        SecurityValidator.validate_length(
            text,
            max_length=max_length,
            field_name='Text'
        )
        SecurityValidator.validate_no_xss(text)
        SecurityValidator.validate_no_sql_injection(text)
        
        # Escape HTML characters
        return escape(text)
    
    @staticmethod
    def validate_url(url):
        """Validate URL format and security."""
        # Simple URL validation
        url_pattern = r'^https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&\'()*+,;=]+$'
        
        if not re.match(url_pattern, url):
            raise ValidationError('Invalid URL format.')
        
        if len(url) > 2048:
            raise ValidationError('URL is too long.')
        
        # Check for dangerous protocols
        if url.lower().startswith('javascript:'):
            raise ValidationError('JavaScript URLs are not allowed.')
    
    @staticmethod
    def validate_ip_address(ip):
        """Validate IP address format."""
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        ipv6_pattern = r'^([0-9a-fA-F]{0,4}:){2,7}([0-9a-fA-F]{0,4})$'
        
        if not (re.match(ipv4_pattern, ip) or re.match(ipv6_pattern, ip)):
            raise ValidationError('Invalid IP address format.')
    
    @staticmethod
    def validate_file_upload(file, allowed_extensions=None, max_size_mb=5):
        """Validate file upload."""
        if allowed_extensions is None:
            allowed_extensions = ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt']
        
        # Check file extension
        file_ext = file.name.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise ValidationError(
                f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
            )
        
        # Check file size
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(
                f'File size cannot exceed {max_size_mb}MB.'
            )


class ArticleValidator(SecurityValidator):
    """Validators for Article model."""
    
    @staticmethod
    def validate_article_title(title):
        """Validate article title."""
        SecurityValidator.validate_length(
            title,
            min_length=5,
            max_length=255,
            field_name='Title'
        )
        SecurityValidator.validate_no_xss(title)
        SecurityValidator.validate_no_sql_injection(title)
    
    @staticmethod
    def validate_article_content(content):
        """Validate article content."""
        SecurityValidator.validate_length(
            content,
            min_length=10,
            max_length=100000,
            field_name='Content'
        )
        # Allow some HTML but no scripts
        if '<script' in content.lower():
            raise ValidationError('Script tags are not allowed in content.')


class UserValidator(SecurityValidator):
    """Validators for User model."""
    
    @staticmethod
    def validate_user_email(email):
        """Validate user email."""
        SecurityValidator.validate_email(email)
    
    @staticmethod
    def validate_user_username(username):
        """Validate user username."""
        SecurityValidator.validate_username(username)
    
    @staticmethod
    def validate_user_password(password, username=None):
        """Validate user password."""
        SecurityValidator.validate_password_strength(password, username)
