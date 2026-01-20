"""Custom DRF exception handlers."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler for DRF views."""
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is None:
        # Handle unhandled exceptions
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return Response(
            {
                'error': 'An unexpected error occurred',
                'detail': str(exc) if not isinstance(exc, Exception) else 'Internal server error'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Add custom error format to response
    if response.status_code >= 400:
        response.data = {
            'status': 'error',
            'status_code': response.status_code,
            'data': response.data if isinstance(response.data, dict) else {'detail': response.data}
        }
    
    return response
