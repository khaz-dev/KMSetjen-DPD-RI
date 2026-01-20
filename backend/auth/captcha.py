"""
CAPTCHA Verification Service
Handles verification of reCAPTCHA tokens
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def verify_recaptcha(token):
    """
    Verify reCAPTCHA token with Google's verification endpoint.
    
    Args:
        token (str): The CAPTCHA token from client
        
    Returns:
        bool: True if CAPTCHA is valid, False otherwise
    """
    if not settings.ENABLE_CAPTCHA:
        return True
    
    if not token:
        return False
    
    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': settings.RECAPTCHA_SECRET_KEY,
                'response': token
            },
            timeout=5
        )
        
        result = response.json()
        
        # For reCAPTCHA v3: Check score (0.0 - 1.0)
        # Higher score means more likely to be human
        if 'score' in result:
            is_valid = result.get('success', False) and result.get('score', 0) > 0.5
            if not is_valid:
                logger.warning(
                    f"reCAPTCHA v3 verification failed. Score: {result.get('score')}, "
                    f"Action: {result.get('action')}"
                )
            return is_valid
        
        # For reCAPTCHA v2: Just check success
        is_valid = result.get('success', False)
        if not is_valid:
            logger.warning(f"reCAPTCHA v2 verification failed. Errors: {result.get('error-codes')}")
        return is_valid
        
    except requests.exceptions.RequestException as e:
        logger.error(f"CAPTCHA verification request failed: {str(e)}")
        return False
    except (KeyError, ValueError) as e:
        logger.error(f"CAPTCHA verification response parsing failed: {str(e)}")
        return False
