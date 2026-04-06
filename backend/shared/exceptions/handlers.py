"""Custom DRF exception handlers."""
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)


def get_bilingual_error_message(exc_type, exc_message):
    """
    Get bilingual (Indonesian/English) error messages.
    
    Returns tuple of (error_message_id, error_message_en)
    """
    # Database transaction errors
    if 'TransactionManagementError' in exc_type:
        return (
            'Terjadi kesalahan saat menyimpan data. Harap coba lagi.',
            'An error occurred while saving data. Please try again.'
        )
    
    # JSON serialization errors (usually from audit logs)
    if 'TypeError' in exc_type and 'JSON' in exc_message:
        return (
            'Terjadi kesalahan saat memproses berkas gambar. Harap coba upload ulang.',
            'An error occurred while processing the image file. Please try uploading again.'
        )
    
    # Database integrity errors
    if 'IntegrityError' in exc_type:
        return (
            'Data yang Anda kirim sudah ada atau tidak valid. Harap periksa kembali.',
            'The data you submitted already exists or is invalid. Please check and try again.'
        )
    
    # Field error in audio/image processing
    if 'FieldError' in exc_type:
        return (
            'Terjadi kesalahan pada field data. Harap hubungi administrator.',
            'A field data error occurred. Please contact the administrator.'
        )
    
    # Request timeout or connection error
    if 'TimeoutError' in exc_type or 'ConnectionError' in exc_type:
        return (
            'Koneksi ke server hilang. Harap periksa koneksi internet Anda.',
            'Connection to server lost. Please check your internet connection.'
        )
    
    # Default generic error
    return (
        'Terjadi kesalahan internal pada server. Harap coba lagi nanti.',
        'An internal server error occurred. Please try again later.'
    )


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF views.
    
    Returns detailed, user-friendly error messages with bilingual support.
    Provides both Indonesian (id) and English (en) error messages.
    """
    try:
        # Call REST framework's default exception handler first
        response = drf_exception_handler(exc, context)
        
        if response is None:
            # Handle unhandled exceptions - provide bilingual messages
            exc_type = type(exc).__name__
            exc_message = str(exc)
            
            msg_id, msg_en = get_bilingual_error_message(exc_type, exc_message)
            
            logger.error(f"Unhandled exception: {exc_type}: {exc_message}", exc_info=True)
            
            return Response(
                {
                    'error': 'Kesalahan Internal Server',
                    'error_en': 'Internal Server Error',
                    'detail': msg_id,
                    'detail_en': msg_en,
                    'type': exc_type
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Format successful error responses with clarity and bilingual support
        if response.status_code >= 400:
            # For validation errors, provide field-specific details
            if isinstance(exc, ValidationError):
                logger.warning(f"Validation error: {response.data}")
                return Response(
                    {
                        'error': 'Validasi Gagal',
                        'error_en': 'Validation Failed',
                        'status_code': response.status_code,
                        'detail': response.data
                    },
                    status=response.status_code
                )
            
            # For other errors, provide standard format with bilingual support
            error_text = response.data if isinstance(response.data, str) else 'Permintaan Gagal'
            error_text_en = response.data if isinstance(response.data, str) else 'Request Failed'
            
            response.data = {
                'error': error_text,
                'error_en': error_text_en,
                'status_code': response.status_code,
                'detail': response.data if isinstance(response.data, dict) else {'message': str(response.data)}
            }
        
        return response
        
    except Exception as e:
        # Catch any errors in the exception handler itself
        exc_type = type(e).__name__
        exc_message = str(e)
        
        msg_id, msg_en = get_bilingual_error_message(exc_type, exc_message)
        
        logger.critical(f"Exception handler error: {exc_type}: {exc_message}", exc_info=True)
        
        return Response(
            {
                'error': 'Kesalahan Internal Server',
                'error_en': 'Internal Server Error',
                'detail': msg_id,
                'detail_en': msg_en,
                'handler_error': exc_type
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

