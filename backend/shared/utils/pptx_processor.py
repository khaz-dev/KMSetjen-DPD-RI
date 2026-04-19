"""
PPTX File Processing Utilities
Handles PPTX to PDF conversion, thumbnail generation, and caching
"""

import io
import os
import logging
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

logger = logging.getLogger(__name__)


class PptxProcessor:
    """Process PPTX files: convert to PDF, generate thumbnails, extract info"""
    
    MAX_THUMBNAIL_WIDTH = 320
    MAX_THUMBNAIL_HEIGHT = 240
    
    @staticmethod
    def get_file_hash(file_path):
        """Generate hash of file for cache key"""
        hash_md5 = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b''):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            logger.error(f"Error computing file hash: {e}")
            return None
    
    @staticmethod
    def get_pptx_info(pptx_file_path):
        """
        Extract basic information from PPTX file
        
        Returns:
            dict: {
                'slide_count': int,
                'title': str,
                'width': int,
                'height': int,
                'aspect_ratio': str,
            }
        """
        if not HAS_PPTX:
            logger.error("python-pptx not installed - cannot read PPTX files")
            return None
        
        try:
            logger.info(f"[PPTX_INFO] Opening file: {pptx_file_path}")
            
            # Check if file exists
            if not os.path.exists(pptx_file_path):
                logger.error(f"[PPTX_INFO] File does not exist: {pptx_file_path}")
                return None
            
            # Check file size
            file_size = os.path.getsize(pptx_file_path)
            logger.info(f"[PPTX_INFO] File size: {file_size} bytes")
            
            # Try to open with python-pptx
            prs = Presentation(pptx_file_path)
            logger.info(f"[PPTX_INFO] Successfully opened PPTX - slides: {len(prs.slides)}")
            
            # Get title from first slide
            title = ""
            if prs.slides and len(prs.slides) > 0:
                first_slide = prs.slides[0]
                for shape in first_slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        title = shape.text[:100]
                        break
            
            # Calculate dimensions
            slide_width = int(prs.slide_width / 914400)  # Convert EMU to pixels
            slide_height = int(prs.slide_height / 914400)
            
            # Calculate aspect ratio safely
            try:
                aspect_ratio = prs.slide_width / prs.slide_height
                aspect_ratio_str = f"{aspect_ratio:.2f}:1"
            except:
                aspect_ratio_str = "1.33:1"
            
            result = {
                'slide_count': len(prs.slides),
                'title': title,
                'width': slide_width,
                'height': slide_height,
                'aspect_ratio': aspect_ratio_str
            }
            
            logger.info(f"[PPTX_INFO] Result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"[PPTX_INFO] Error reading PPTX info from {pptx_file_path}: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def generate_slide_thumbnail(pptx_file_path, slide_index=0, width=None, height=None):
        """
        Generate thumbnail image of a specific slide
        
        Args:
            pptx_file_path: Path to PPTX file
            slide_index: Index of slide to convert (0-based)
            width: Output width (uses default if None)
            height: Output height (uses default if None)
            
        Returns:
            bytes: PNG image data or None on error
        """
        if not HAS_PPTX:
            logger.error("[THUMBNAIL_GEN] python-pptx not installed")
            return None
        
        try:
            logger.debug(f"[THUMBNAIL_GEN] Starting - file: {pptx_file_path}, slide: {slide_index}")
            
            width = width or PptxProcessor.MAX_THUMBNAIL_WIDTH
            height = height or PptxProcessor.MAX_THUMBNAIL_HEIGHT
            
            logger.debug(f"[THUMBNAIL_GEN] Dimensions: {width}x{height}")
            
            prs = Presentation(pptx_file_path)
            logger.debug(f"[THUMBNAIL_GEN] Opened PPTX - total slides: {len(prs.slides)}")
            
            if slide_index >= len(prs.slides):
                logger.warning(f"[THUMBNAIL_GEN] Slide index {slide_index} out of range (total: {len(prs.slides)})")
                return None
            
            slide = prs.slides[slide_index]
            logger.debug(f"[THUMBNAIL_GEN] Retrieved slide {slide_index}")
            
            # Create image with slide aspect ratio
            slide_width = int(prs.slide_width / 914400)
            slide_height = int(prs.slide_height / 914400)
            
            # Calculate scale
            scale = min(width / slide_width, height / slide_height)
            img_width = int(slide_width * scale)
            img_height = int(slide_height * scale)
            
            logger.debug(f"[THUMBNAIL_GEN] Creating image - size: {img_width}x{img_height}, scale: {scale:.2f}")
            
            # Create white background
            img = Image.new('RGB', (img_width, img_height), color='white')
            draw = ImageDraw.Draw(img)
            
            # Draw slide background
            try:
                if slide.background.fill.type:
                    fill = slide.background.fill
                    if hasattr(fill, 'fore_color') and hasattr(fill.fore_color, 'rgb'):
                        color = tuple(fill.fore_color.rgb)[:3]
                        draw.rectangle([(0, 0), (img_width, img_height)], fill=color)
            except:
                pass
            
            # Draw slide content
            shape_count = 0
            for shape in slide.shapes:
                try:
                    # Handle text shapes
                    if hasattr(shape, "text") and shape.text:
                        x = int(shape.left / 914400 * scale)
                        y = int(shape.top / 914400 * scale)
                        
                        # Draw text
                        text = shape.text[:50]  # Limit text length
                        try:
                            draw.text((x, y), text, fill='black', font=None)
                            shape_count += 1
                        except:
                            pass
                    
                    # Handle image shapes
                    if hasattr(shape, "image"):
                        image = shape.image
                        img_data = io.BytesIO(image.blob)
                        try:
                            shape_img = Image.open(img_data)
                            x = int(shape.left / 914400 * scale)
                            y = int(shape.top / 914400 * scale)
                            w = int(shape.width / 914400 * scale)
                            h = int(shape.height / 914400 * scale)
                            
                            shape_img_resized = shape_img.resize((w, h), Image.Resampling.LANCZOS)
                            img.paste(shape_img_resized, (x, y))
                            shape_count += 1
                        except:
                            pass
                except Exception as e:
                    logger.debug(f"[THUMBNAIL_GEN] Could not render shape: {e}")
                    continue
            
            logger.debug(f"[THUMBNAIL_GEN] Rendered {shape_count} shapes")
            
            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='PNG')
            png_bytes = output.getvalue()
            
            logger.debug(f"[THUMBNAIL_GEN] Generated PNG - size: {len(png_bytes)} bytes")
            return png_bytes
            
        except Exception as e:
            logger.error(f"[THUMBNAIL_GEN] Error generating thumbnail for slide {slide_index}: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def generate_all_slides_thumbnails(pptx_file_path, width=None, height=None):
        """
        Generate thumbnails for all slides
        
        Returns:
            list: List of PNG bytes for each slide
        """
        if not HAS_PPTX:
            return []
        
        try:
            prs = Presentation(pptx_file_path)
            thumbnails = []
            
            for i in range(len(prs.slides)):
                thumb = PptxProcessor.generate_slide_thumbnail(
                    pptx_file_path, 
                    slide_index=i,
                    width=width,
                    height=height
                )
                if thumb:
                    thumbnails.append(thumb)
            
            return thumbnails
        except Exception as e:
            logger.error(f"Error generating all thumbnails: {e}")
            return []
    
    @staticmethod
    def convert_to_pdf(pptx_file_path, output_path=None):
        """
        Convert PPTX to PDF using LibreOffice
        
        Requires: LibreOffice with headless capability
        
        Returns:
            str: Path to generated PDF or None on error
        """
        import subprocess
        
        try:
            if not output_path:
                output_path = pptx_file_path.replace('.pptx', '.pdf')
            
            # Use LibreOffice in headless mode
            cmd = [
                'libreoffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', os.path.dirname(output_path),
                pptx_file_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=60,
                text=True
            )
            
            if result.returncode == 0 and os.path.exists(output_path):
                logger.info(f"Successfully converted PPTX to PDF: {output_path}")
                return output_path
            else:
                logger.error(f"LibreOffice conversion failed: {result.stderr}")
                return None
                
        except FileNotFoundError:
            logger.error("LibreOffice not found. Install with: apt-get install libreoffice")
            return None
        except subprocess.TimeoutExpired:
            logger.error("PDF conversion timed out")
            return None
        except Exception as e:
            logger.error(f"Error converting PPTX to PDF: {e}")
            return None


class CacheManager:
    """Manage caching of PPTX conversions and thumbnails"""
    
    @staticmethod
    def get_cache_dir():
        """Get or create cache directory"""
        from django.conf import settings
        cache_dir = os.path.join(settings.MEDIA_ROOT, '.pptx_cache')
        os.makedirs(cache_dir, exist_ok=True)
        return cache_dir
    
    @staticmethod
    def get_cache_key(file_path, operation):
        """Generate cache key from file path and operation"""
        file_hash = PptxProcessor.get_file_hash(file_path)
        if not file_hash:
            return None
        return f"pptx_{operation}_{file_hash}"
    
    @staticmethod
    def cache_thumbnail(file_path, slide_index=0):
        """Cache thumbnail in filesystem"""
        try:
            cache_dir = CacheManager.get_cache_dir()
            file_hash = PptxProcessor.get_file_hash(file_path)
            
            if not file_hash:
                return None
            
            cache_file = os.path.join(cache_dir, f"thumb_{file_hash}_slide_{slide_index}.png")
            
            # Return cached if exists
            if os.path.exists(cache_file):
                with open(cache_file, 'rb') as f:
                    return f.read()
            
            # Generate and cache
            thumb_data = PptxProcessor.generate_slide_thumbnail(file_path, slide_index)
            if thumb_data:
                with open(cache_file, 'wb') as f:
                    f.write(thumb_data)
                return thumb_data
            
            return None
        except Exception as e:
            logger.error(f"Error caching thumbnail: {e}")
            return None
