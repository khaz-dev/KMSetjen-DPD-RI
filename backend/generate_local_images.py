#!/usr/bin/env python
"""
Generate missing article and category images for LOCAL development
"""
import os
import sys
import django
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.files.base import ContentFile
from apps.content.models import Article, Category

# Color palette for categories
category_colors = {
    1: (41, 128, 185),      # Blue - Public Policy
    2: (192, 57, 43),       # Red - Announcements
    3: (46, 204, 113),      # Green - Guides & Tutorials
    4: (230, 126, 34),      # Orange - Reports & Evaluation
    5: (155, 89, 182),      # Purple - News & Media
}

def create_article_image(title, category_id):
    """Create an article image with PIL"""
    # Get category color or use default
    color = category_colors.get(category_id, (100, 100, 100))
    
    # Create image
    img = Image.new('RGB', (400, 300), color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 18)
        small_font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 14)
    except:
        font = ImageFont.load_default()
        small_font = font
    
    # Add text
    lines = []
    words = title.split()
    current_line = ""
    
    for word in words:
        if len(current_line) + len(word) + 1 <= 30:
            current_line += word + " "
        else:
            if current_line:
                lines.append(current_line.strip())
            current_line = word + " "
    if current_line:
        lines.append(current_line.strip())
    
    # Draw lines centered
    y_offset = 100 if len(lines) < 3 else 80
    for line in lines[:3]:  # Max 3 lines
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (400 - text_width) // 2
        draw.text((x, y_offset), line, fill=(255, 255, 255), font=font)
        y_offset += 40
    
    # Save to bytes
    output = BytesIO()
    img.save(output, format='PNG')
    output.seek(0)
    return output

def create_category_image(name, primary_color, secondary_color):
    """Create a category image with PIL"""
    # Create image with gradient
    img = Image.new('RGB', (400, 300), primary_color)
    draw = ImageDraw.Draw(img)
    
    # Add some visual interest with semi-transparent overlay
    overlay = Image.new('RGB', (400, 300), secondary_color)
    img.paste(overlay, (0, 100), mask=Image.new('L', (400, 200), 128))
    
    # Try to use a nice font
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), name, font=font)
    text_width = bbox[2] - bbox[0]
    x = (400 - text_width) // 2
    draw.text((x, 130), name, fill=(255, 255, 255), font=font)
    
    # Save to bytes
    output = BytesIO()
    img.save(output, format='PNG')
    output.seek(0)
    return output

print("=" * 80)
print("GENERATING MISSING ARTICLE IMAGES FOR LOCAL DEVELOPMENT")
print("=" * 80)

# Generate missing article images
articles = Article.objects.filter(is_published=True).order_by('id')
generated = 0

for article in articles:
    # Check if image file exists
    if article.image:
        image_path = article.image.path if hasattr(article.image, 'path') else None
        if image_path and Path(image_path).exists():
            print(f"✓ Article {article.id}: Image already exists - {article.image.name.split('/')[-1]}")
            continue
    
    # Generate image
    title = article.title_en or article.title_id
    image_content = create_article_image(title, article.category_id)
    filename = f"article_{article.id}_{title[:20].lower().replace(' ', '_').replace('/', '_')}.png"
    
    # Save to database
    full_path = f"articles/articles/{filename}"
    article.image.save(full_path, image_content, save=True)
    generated += 1
    print(f"✓ Generated Article {article.id}: {title[:40]}")

print(f"\nGenerated {generated} new article images")

print("\n" + "=" * 80)
print("VERIFYING CATEGORY IMAGES")
print("=" * 80)

# Verify category images are correct
categories = Category.objects.all()
for cat in categories:
    if cat.image and Path(cat.image.path).exists():
        print(f"✓ Category {cat.id} ({cat.name_en}): Image OK")
    else:
        print(f"✗ Category {cat.id} ({cat.name_en}): Image missing")

print("\n" + "=" * 80)
print("FINAL VERIFICATION")
print("=" * 80)

articles_with_images = Article.objects.filter(is_published=True, image__isnull=False).exclude(image="").count()
categories_with_images = Category.objects.filter(image__isnull=False).exclude(image="").count()

total_articles = Article.objects.filter(is_published=True).count()
total_categories = Category.objects.all().count()

print(f"Articles: {articles_with_images} / {total_articles}")
print(f"Categories: {categories_with_images} / {total_categories}")

if articles_with_images == total_articles and categories_with_images == total_categories:
    print("\n✅ ALL IMAGES READY FOR LOCAL DEVELOPMENT!")
else:
    print(f"\n⚠️  Still missing: {total_articles - articles_with_images} articles, {total_categories - categories_with_images} categories")
