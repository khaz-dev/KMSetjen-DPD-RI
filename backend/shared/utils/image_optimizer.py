"""
Image optimization utility for KMSetjen DPD RI.
Compresses, resizes, and converts uploaded images to modern WebP format
to minimize server storage, reduce network bandwidth, and accelerate client rendering.
"""
import io
import os
import logging
from PIL import Image, ImageOps
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

# Standard preset sizes for different image types
MAX_SIZE_AVATAR = (400, 400)      # User profile avatars (retina 200x200)
MAX_SIZE_CATEGORY = (800, 800)    # Category badges / banner thumbnails
MAX_SIZE_ARTICLE = (1600, 1200)   # Article featured banners


def has_transparency(img: Image.Image) -> bool:
    """Check if a PIL Image actually contains transparent or semi-transparent pixels."""
    if img.mode in ('RGBA', 'LA'):
        alpha = img.split()[-1]
        # If any pixel in alpha channel is less than 255, it has transparency
        return any(px < 255 for px in alpha.getdata())
    elif img.mode == 'P' and 'transparency' in img.info:
        return True
    return False


def optimize_image_file(
    image_file,
    max_size=MAX_SIZE_ARTICLE,
    quality=82,
    output_format='WEBP',
    convert_extension=True
):
    """
    Optimize an image file:
    - Normalizes EXIF rotation
    - Downscales if larger than max_size while maintaining aspect ratio
    - Converts RGBA to RGB if transparency is not used
    - Encodes to modern WebP (or specified format) with high-efficiency compression
    - Returns a Django ContentFile with updated filename and content

    Args:
        image_file: Django UploadedFile, FieldFile, or file-like object
        max_size: tuple (max_width, max_height)
        quality: int compression quality (1-100, default 82)
        output_format: str 'WEBP', 'JPEG', etc. (default 'WEBP')
        convert_extension: bool whether to change filename extension to match output_format

    Returns:
        ContentFile: Optimized file ready to be saved to an ImageField,
                     or original file if optimization cannot/should not be performed.
    """
    if not image_file:
        return image_file

    filename = getattr(image_file, 'name', 'image.jpg')
    base_name, ext = os.path.splitext(filename)
    ext_lower = ext.lower()

    # Skip vector files like SVG
    if ext_lower == '.svg':
        return image_file

    try:
        # Read file content safely
        if hasattr(image_file, 'open'):
            try:
                image_file.open()
            except Exception:
                pass
        
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
            file_bytes = image_file.read()
            image_file.seek(0)
        else:
            file_bytes = image_file.read()

        if not file_bytes:
            return image_file

        with Image.open(io.BytesIO(file_bytes)) as img:
            # Preserve animated GIFs if animated
            if getattr(img, 'is_animated', False) and img.n_frames > 1:
                logger.info(f"Preserving animated GIF: {filename}")
                return image_file

            # 1. Correct orientation using EXIF (especially phone camera uploads)
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # 2. Downscale if dimensions exceed max_size
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # 3. Handle color modes and transparency
            out_format = output_format.upper()
            if out_format == 'WEBP':
                if has_transparency(img):
                    if img.mode != 'RGBA':
                        img = img.convert('RGBA')
                else:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
            elif out_format in ('JPEG', 'JPG'):
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background for transparent areas when saving to JPEG
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

            # 4. Save to buffer
            buf = io.BytesIO()
            save_kwargs = {'format': out_format, 'quality': quality}
            if out_format == 'WEBP':
                save_kwargs['method'] = 6  # Best compression speed/ratio tradeoff
            elif out_format in ('JPEG', 'JPG'):
                save_kwargs['optimize'] = True
                save_kwargs['progressive'] = True
            elif out_format == 'PNG':
                save_kwargs['optimize'] = True

            img.save(buf, **save_kwargs)
            optimized_bytes = buf.getvalue()

            # If optimization didn't reduce size (rare, e.g. already compressed tiny image),
            # but format change was requested, check savings
            orig_size = len(file_bytes)
            opt_size = len(optimized_bytes)
            logger.info(
                f"Image optimized [{filename}]: {orig_size/1024:.1f}KB -> {opt_size/1024:.1f}KB "
                f"(-{100 - (opt_size/orig_size*100):.1f}%)"
            )

            # 5. Determine new filename
            new_filename = filename
            if convert_extension and out_format == 'WEBP':
                new_filename = f"{base_name}.webp"
            elif convert_extension and out_format in ('JPEG', 'JPG'):
                new_filename = f"{base_name}.jpg"

            content_file = ContentFile(optimized_bytes, name=new_filename)
            return content_file

    except Exception as e:
        logger.warning(f"Failed to optimize image {filename}: {str(e)}. Using original file.", exc_info=True)
        # In case seek is needed
        if hasattr(image_file, 'seek'):
            try:
                image_file.seek(0)
            except Exception:
                pass
        return image_file
