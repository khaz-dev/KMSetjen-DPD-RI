#!/usr/bin/env python
import os
import django
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont

def create_article_image(article_title, category_color):
    """
    Create a featured image for article with gradient based on category color.
    
    Args:
        article_title: Title of the article
        category_color: RGB tuple for gradient color
    
    Returns:
        ContentFile with PNG image data
    """
    # Create image with gradient background
    width, height = 400, 300
    image = Image.new('RGB', (width, height), category_color)
    draw = ImageDraw.Draw(image)
    
    # Create gradient effect from primary color to lighter shade
    secondary_color = tuple(min(255, int(c * 1.3)) for c in category_color)
    
    for y in range(height):
        ratio = y / height
        r = int(category_color[0] + (secondary_color[0] - category_color[0]) * ratio)
        g = int(category_color[1] + (secondary_color[1] - category_color[1]) * ratio)
        b = int(category_color[2] + (secondary_color[2] - category_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Add semi-transparent overlay with subtle pattern
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 50))
    image.paste(overlay, (0, 0), overlay)
    
    # Convert to RGB if necessary
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Add text - truncate long titles
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except:
        font = ImageFont.load_default()
    
    # Wrap text if too long
    max_chars = 35
    if len(article_title) > max_chars:
        article_title = article_title[:max_chars-3] + "..."
    
    # Calculate text position
    text_bbox = draw.textbbox((0, 0), article_title, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Draw text with white color and slight shadow
    draw.text((x+2, y+2), article_title, fill=(0, 0, 0, 60), font=font)
    draw.text((x, y), article_title, fill=(255, 255, 255), font=font)
    
    # Convert to bytes
    img_io = BytesIO()
    image.save(img_io, format='PNG')
    img_io.seek(0)
    
    return ContentFile(img_io.getvalue(), name=f'article_{article_title[:20].lower().replace(" ", "_")}.png')

# Category colors for articles
category_colors = {
    1: (25, 118, 210),      # Kebijakan Publik - Blue
    2: (244, 67, 54),       # Pengumuman - Red
    3: (76, 175, 80),       # Panduan & Tutorial - Green
    4: (255, 152, 0),       # Laporan & Evaluasi - Orange
    5: (156, 39, 176),      # Berita & Media - Purple
}

print("=== Adding Article Images ===\n")

articles = Article.objects.filter(is_published=True)
for article in articles:
    try:
        # Get category color or use default
        color = category_colors.get(article.category_id, (100, 100, 100))
        
        # Create image
        title = article.title_en or article.title_id
        image_content = create_article_image(title, color)
        
        # Save to article
        filename = f'articles/article_{article.id}_{title[:20].lower().replace(" ", "_")}.png'
        article.image.save(filename, image_content, save=True)
        
        print(f"✓ Added image for Article {article.id}: {title[:40]}")
        print(f"  Image: {article.image.url if article.image else 'None'}\n")
    except Exception as e:
        print(f"✗ Error for Article {article.id}: {str(e)}\n")

print("\n=== Verification ===")
for article in Article.objects.filter(is_published=True):
    has_image = "✓" if article.image else "✗"
    title = article.title_en or article.title_id
    print(f"{has_image} Article {article.id}: {title[:40]} - {article.image.url if article.image else 'No image'}")
