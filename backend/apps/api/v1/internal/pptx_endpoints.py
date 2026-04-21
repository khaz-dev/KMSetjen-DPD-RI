"""
PPTX conversion and thumbnail API endpoints
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.base import ContentFile
from django.conf import settings
import os
import base64
import logging

from apps.content.models import File as FileModel
from shared.utils.pptx_processor import PptxProcessor, CacheManager, HAS_PPTX
from shared.permissions.pptx import IsAuthenticatedOrPublicArticleFile

logger = logging.getLogger(__name__)

logger.info(f"[PPTX_ENDPOINTS] Initialized - HAS_PPTX: {HAS_PPTX}")


class PptxConversionMixin:
    """
    Mixin to add PPTX conversion endpoints to FileViewSet
    """
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrPublicArticleFile])
    def thumbnail(self, request, article_id=None, pk=None):
        """
        Get thumbnail for PPTX file
        
        GET /api/v1/internal/articles/{article_id}/files/{id}/thumbnail/?slide=0
        
        Query params:
            - slide: Slide number (0-indexed, default: 0)
            - width: Thumbnail width in pixels (default: 320)
            - height: Thumbnail height in pixels (default: 240)
        """
        try:
            file_obj = self.get_object()
            
            # Only works for PPTX files
            if not file_obj.mime_type or 'presentation' not in file_obj.mime_type:
                return Response(
                    {'error': 'This endpoint only works with presentation files'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get parameters
            slide_index = int(request.query_params.get('slide', 0))
            width = int(request.query_params.get('width', 320))
            height = int(request.query_params.get('height', 240))
            
            # Get file path
            file_path = file_obj.file.path
            if not os.path.exists(file_path):
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Generate or get cached thumbnail
            thumb_data = CacheManager.cache_thumbnail(file_path, slide_index)
            
            if not thumb_data:
                return Response(
                    {'error': 'Failed to generate thumbnail'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Return as base64 data URL
            b64_data = base64.b64encode(thumb_data).decode('utf-8')
            return Response({
                'thumbnail': f'data:image/png;base64,{b64_data}',
                'slide': slide_index,
                'size': len(thumb_data)
            })
            
        except ValueError:
            return Response(
                {'error': 'Invalid query parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error generating thumbnail: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrPublicArticleFile])
    def thumbnails_all(self, request, article_id=None, pk=None):
        """
        Get thumbnails for all slides
        
        GET /api/v1/internal/articles/{article_id}/files/{id}/thumbnails_all/
        
        Returns base64 data URLs for all slides
        """
        try:
            if not HAS_PPTX:
                logger.error("[THUMBNAILS_ALL_ACTION] python-pptx is not installed")
                return Response(
                    {'error': 'python-pptx is not installed on server'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            logger.info(f"[THUMBNAILS_ALL_ACTION] Started - article_id: {article_id}, pk: {pk}")
            
            file_obj = self.get_object()
            logger.info(f"[THUMBNAILS_ALL_ACTION] File object retrieved - id: {file_obj.id}")
            
            if not file_obj.mime_type or 'presentation' not in file_obj.mime_type:
                logger.warning(f"[THUMBNAILS_ALL_ACTION] Not a presentation file - mime_type: {file_obj.mime_type}")
                return Response(
                    {'error': 'This endpoint only works with presentation files'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_path = file_obj.file.path
            logger.info(f"[THUMBNAILS_ALL_ACTION] File path: {file_path}")
            
            if not os.path.exists(file_path):
                logger.error(f"[THUMBNAILS_ALL_ACTION] File not found at path: {file_path}")
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get file info (including slide count)
            logger.info(f"[THUMBNAILS_ALL_ACTION] Getting PPTX info...")
            pptx_info = PptxProcessor.get_pptx_info(file_path)
            if not pptx_info:
                logger.error(f"[THUMBNAILS_ALL_ACTION] Failed to get PPTX info")
                return Response(
                    {'error': 'Failed to read presentation'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f"[THUMBNAILS_ALL_ACTION] PPTX info retrieved - slides: {pptx_info['slide_count']}")
            
            # Generate thumbnails for all slides
            thumbnails = []
            max_slides = min(pptx_info['slide_count'], 50)  # Limit to 50 slides
            logger.info(f"[THUMBNAILS_ALL_ACTION] Generating {max_slides} thumbnails...")
            
            for i in range(max_slides):
                try:
                    logger.debug(f"[THUMBNAILS_ALL_ACTION] Generating thumbnail for slide {i}...")
                    thumb_data = CacheManager.cache_thumbnail(file_path, i)
                    if thumb_data:
                        b64_data = base64.b64encode(thumb_data).decode('utf-8')
                        thumbnails.append({
                            'slide': i,
                            'thumbnail': f'data:image/png;base64,{b64_data}'
                        })
                        logger.debug(f"[THUMBNAILS_ALL_ACTION] Slide {i} thumbnail generated - size: {len(thumb_data)} bytes")
                    else:
                        logger.warning(f"[THUMBNAILS_ALL_ACTION] Failed to generate thumbnail for slide {i}")
                except Exception as slide_error:
                    logger.error(f"[THUMBNAILS_ALL_ACTION] Error generating slide {i}: {str(slide_error)}")
                    continue
            
            logger.info(f"[THUMBNAILS_ALL_ACTION] Thumbnail generation complete - {len(thumbnails)} thumbnails generated")
            
            return Response({
                'file_id': file_obj.id,
                'total_slides': pptx_info['slide_count'],
                'thumbnails': thumbnails
            })
            
        except Exception as e:
            logger.error(f"[THUMBNAILS_ALL_ACTION] Exception occurred: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrPublicArticleFile])
    def pptx_info(self, request, article_id=None, pk=None):
        """
        Get PPTX file information
        
        GET /api/v1/internal/articles/{article_id}/files/{id}/pptx_info/
        
        Returns: slide count, title, dimensions
        """
        try:
            # Check if python-pptx is available
            if not HAS_PPTX:
                logger.error("[PPTX_INFO_ACTION] python-pptx is not installed")
                return Response(
                    {'error': 'python-pptx is not installed on server - cannot process presentations'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            logger.info(f"[PPTX_INFO_ACTION] Started - article_id: {article_id}, pk: {pk}")
            
            file_obj = self.get_object()
            logger.info(f"[PPTX_INFO_ACTION] File object retrieved - id: {file_obj.id}, mime_type: {file_obj.mime_type}")
            
            if not file_obj.mime_type or 'presentation' not in file_obj.mime_type:
                logger.warning(f"[PPTX_INFO_ACTION] Not a presentation file - mime_type: {file_obj.mime_type}")
                return Response(
                    {'error': 'This endpoint only works with presentation files'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_path = file_obj.file.path
            logger.info(f"[PPTX_INFO_ACTION] File path: {file_path}")
            
            if not os.path.exists(file_path):
                logger.error(f"[PPTX_INFO_ACTION] File not found at path: {file_path}")
                return Response(
                    {'error': f'File not found at {file_path}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(f"[PPTX_INFO_ACTION] Calling PptxProcessor.get_pptx_info()")
            info = PptxProcessor.get_pptx_info(file_path)
            
            if not info:
                logger.error(f"[PPTX_INFO_ACTION] PptxProcessor.get_pptx_info() returned None")
                return Response(
                    {'error': 'Failed to read presentation'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f"[PPTX_INFO_ACTION] Successfully got info: {info}")
            
            return Response({
                'file_id': file_obj.id,
                'filename': file_obj.original_filename,
                'file_size': file_obj.file_size,
                **info
            })
            
        except Exception as e:
            logger.error(f"[PPTX_INFO_ACTION] Exception occurred: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def convert_pdf(self, request, article_id=None, pk=None):
        """
        Convert PPTX to PDF
        
        POST /api/v1/internal/articles/{article_id}/files/{id}/convert_pdf/
        
        Returns: base64 PDF data or URL to cached PDF
        """
        try:
            file_obj = self.get_object()
            
            if not file_obj.mime_type or 'presentation' not in file_obj.mime_type:
                return Response(
                    {'error': 'This endpoint only works with presentation files'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_path = file_obj.file.path
            if not os.path.exists(file_path):
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if LibreOffice is available
            import shutil
            if not shutil.which('libreoffice'):
                return Response(
                    {'warning': 'LibreOffice not installed. Feature requires: apt-get install libreoffice',
                     'info': 'Use slide thumbnails or Microsoft Office Online Viewer instead'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Convert to PDF
            cache_dir = CacheManager.get_cache_dir()
            file_hash = PptxProcessor.get_file_hash(file_path)
            pdf_path = os.path.join(cache_dir, f"{file_hash}.pdf")
            
            # Return existing if cached
            if os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as f:
                    pdf_data = f.read()
            else:
                pdf_path = PptxProcessor.convert_to_pdf(file_path, pdf_path)
                if not pdf_path or not os.path.exists(pdf_path):
                    return Response(
                        {'error': 'PDF conversion failed'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                with open(pdf_path, 'rb') as f:
                    pdf_data = f.read()
            
            # Return as base64
            b64_pdf = base64.b64encode(pdf_data).decode('utf-8')
            return Response({
                'file_id': file_obj.id,
                'format': 'pdf',
                'size': len(pdf_data),
                'data': f'data:application/pdf;base64,{b64_pdf}'
            })
            
        except Exception as e:
            logger.error(f"Error converting to PDF: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
