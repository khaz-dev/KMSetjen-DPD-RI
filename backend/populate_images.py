#!/usr/bin/env python
"""
Wrapper script to add images to articles and categories.
Runs both add_article_images.py and add_category_images.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Run article images script
print("\n" + "="*70)
print("STEP 1: ADDING ARTICLE IMAGES")
print("="*70 + "\n")

from io import BytesIO
from apps.content.models import Article
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont

def create_article_image(article_title, category_color):
    """Create a featured image for article with gradient based on category color."""
    width, height = 400, 300
    image = Image.new('RGB', (width, height), category_color)
    draw = ImageDraw.Draw(image)
    
    secondary_color = tuple(min(255, int(c * 1.3)) for c in category_color)
    
    for y in range(height):
        ratio = y / height
        r = int(category_color[0] + (secondary_color[0] - category_color[0]) * ratio)
        g = int(category_color[1] + (secondary_color[1] - category_color[1]) * ratio)
        b = int(category_color[2] + (secondary_color[2] - category_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 50))
    image.paste(overlay, (0, 0), overlay)
    
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except:
        font = ImageFont.load_default()
    
    max_chars = 35
    if len(article_title) > max_chars:
        article_title = article_title[:max_chars-3] + "..."
    
    text_bbox = draw.textbbox((0, 0), article_title, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x+2, y+2), article_title, fill=(0, 0, 0, 60), font=font)
    draw.text((x, y), article_title, fill=(255, 255, 255), font=font)
    
    img_io = BytesIO()
    image.save(img_io, format='PNG')
    img_io.seek(0)
    
    return ContentFile(img_io.getvalue(), name=f'article_{article_title[:20].lower().replace(" ", "_")}.png')

category_colors = {
    1: (25, 118, 210),
    2: (244, 67, 54),
    3: (76, 175, 80),
    4: (255, 152, 0),
    5: (156, 39, 176),
}

articles = Article.objects.filter(is_published=True)
for article in articles:
    try:
        color = category_colors.get(article.category_id, (100, 100, 100))
        title = article.title_en or article.title_id
        image_content = create_article_image(title, color)
        filename = f'articles/article_{article.id}_{title[:20].lower().replace(" ", "_")}.png'
        article.image.save(filename, image_content, save=True)
        print(f"✓ Added image for Article {article.id}: {title[:40]}")
    except Exception as e:
        print(f"✗ Error for Article {article.id}: {str(e)}")

print("\n" + "="*70)
print("STEP 2: ADDING CATEGORY IMAGES")
print("="*70 + "\n")

from apps.content.models import Category

def create_category_image(category_name, primary_color, secondary_color):
    """Create a simple gradient image for category with text overlay."""
    width, height = 400, 300
    image = Image.new('RGB', (width, height), primary_color)
    draw = ImageDraw.Draw(image)
    
    for y in range(height):
        ratio = y / height
        r = int(primary_color[0] + (secondary_color[0] - primary_color[0]) * ratio)
        g = int(primary_color[1] + (secondary_color[1] - primary_color[1]) * ratio)
        b = int(primary_color[2] + (secondary_color[2] - primary_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 40))
    image.paste(overlay, (0, 0), overlay)
    
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    try:
        font = ImageFont.truetype("arial.ttf", 32)
    except:
        font = ImageFont.load_default()
    
    text_bbox = draw.textbbox((0, 0), category_name, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), category_name, fill=(255, 255, 255), font=font)
    
    img_io = BytesIO()
    image.save(img_io, format='PNG')
    img_io.seek(0)
    
    return ContentFile(img_io.getvalue(), name=f'{category_name.lower().replace(" ", "_")}.png')

category_configs = [
    ('Kebijakan Publik', (25, 118, 210), (66, 165, 245)),
    ('Pengumuman', (244, 67, 54), (239, 154, 154)),
    ('Panduan & Tutorial', (76, 175, 80), (129, 199, 132)),
    ('Laporan & Evaluasi', (255, 152, 0), (255, 183, 77)),
    ('Berita & Media', (156, 39, 176), (206, 147, 216)),
]

for cat_name, primary_color, secondary_color in category_configs:
    try:
        category = Category.objects.get(name_id=cat_name)
        image_content = create_category_image(cat_name, primary_color, secondary_color)
        filename = f'categories/{cat_name.lower().replace(" ", "_").replace("&", "and")}.png'
        category.image.save(filename, image_content, save=True)
        print(f"✓ Added image for Category {category.id}: {cat_name}")
    except Category.DoesNotExist:
        print(f"✗ Category not found: {cat_name}")
    except Exception as e:
        print(f"✗ Error for {cat_name}: {str(e)}")

print("\n" + "="*70)
print("VERIFICATION")
print("="*70 + "\n")

print("Articles with images:")
for article in Article.objects.filter(is_published=True):
    has_image = "✓" if article.image else "✗"
    title = article.title_en or article.title_id
    print(f"{has_image} Article {article.id}: {title[:40]}")

print("\nCategories with images:")
for cat in Category.objects.all():
    has_image = "✓" if cat.image else "✗"
    print(f"{has_image} Category {cat.id}: {cat.name_en}")

print("\n✅ IMAGE POPULATION COMPLETE!\n")
