#!/usr/bin/env python
import os
import django
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Category
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont

def create_category_image(category_name, primary_color, secondary_color):
    """
    Create a simple gradient image for category with text overlay.
    
    Args:
        category_name: Name of the category
        primary_color: RGB tuple for primary gradient color
        secondary_color: RGB tuple for secondary gradient color
    
    Returns:
        ContentFile with PNG image data
    """
    # Create image with gradient background
    width, height = 400, 300
    image = Image.new('RGB', (width, height), primary_color)
    draw = ImageDraw.Draw(image)
    
    # Create gradient effect
    for y in range(height):
        ratio = y / height
        r = int(primary_color[0] + (secondary_color[0] - primary_color[0]) * ratio)
        g = int(primary_color[1] + (secondary_color[1] - primary_color[1]) * ratio)
        b = int(primary_color[2] + (secondary_color[2] - primary_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Add semi-transparent overlay
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 40))
    image.paste(overlay, (0, 0), overlay)
    
    # Convert to RGB if necessary
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Add text
    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", 32)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Calculate text position (center)
    text_bbox = draw.textbbox((0, 0), category_name, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Draw text with white color
    draw.text((x, y), category_name, fill=(255, 255, 255), font=font)
    
    # Convert to bytes
    img_io = BytesIO()
    image.save(img_io, format='PNG')
    img_io.seek(0)
    
    return ContentFile(img_io.getvalue(), name=f'{category_name.lower().replace(" ", "_")}.png')

# Category image configurations
# Format: (category_name, primary_color_rgb, secondary_color_rgb)
category_configs = [
    ('Kebijakan Publik', (25, 118, 210), (66, 165, 245)),  # Blue
    ('Pengumuman', (244, 67, 54), (239, 154, 154)),  # Red
    ('Panduan & Tutorial', (76, 175, 80), (129, 199, 132)),  # Green
    ('Laporan & Evaluasi', (255, 152, 0), (255, 183, 77)),  # Orange
    ('Berita & Media', (156, 39, 176), (206, 147, 216)),  # Purple
]

print("=== Adding Category Images ===")
for cat_name, primary_color, secondary_color in category_configs:
    try:
        category = Category.objects.get(name_id=cat_name)
        
        # Create image
        image_content = create_category_image(cat_name, primary_color, secondary_color)
        
        # Save to category
        filename = f'categories/{cat_name.lower().replace(" ", "_").replace("&", "and")}.png'
        category.image.save(filename, image_content, save=True)
        
        print(f"✓ Added image for {cat_name}")
        print(f"  Image URL: {category.image.url if category.image else 'None'}")
    except Category.DoesNotExist:
        print(f"✗ Category not found: {cat_name}")
    except Exception as e:
        print(f"✗ Error for {cat_name}: {str(e)}")

print("\n=== Verification ===")
for cat in Category.objects.all():
    has_image = "✓" if cat.image else "✗"
    print(f"{has_image} {cat.name_id} - {cat.image.url if cat.image else 'No image'}")
