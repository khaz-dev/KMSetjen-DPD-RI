#!/usr/bin/env python
"""
Generate ALL article images from scratch (LOCAL DEVELOPMENT)
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

from apps.content.models import Article, Category

print("=" * 80)
print("GENERATING ALL ARTICLE IMAGES FOR LOCAL DEVELOPMENT")
print("=" * 80)

# Ensure media directory exists
media_dir = Path("media/articles/articles")
media_dir.mkdir(parents=True, exist_ok=True)

# Color palette for categories
category_colors = {
    1: (41, 128, 185),      # Blue - Public Policy
    2: (192, 57, 43),       # Red - Announcements
    3: (46, 204, 113),      # Green - Guides & Tutorials
    4: (230, 126, 34),      # Orange - Reports & Evaluation
    5: (155, 89, 182),      # Purple - News & Media
}

def create_article_image(title, category_id):
    """Create an article image"""
    color = category_colors.get(category_id, (100, 100, 100))
    
    img = Image.new('RGB', (400, 300), color)
    draw = ImageDraw.Draw(img)
    
    # Try to load a font
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    # Add text - wrap long titles
    lines = []
    words = title.split()
    current_line = ""
    
    for word in words:
        test_line = current_line + (" " if current_line else "") + word
        if len(test_line) <= 35:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    # Draw centered text
    y_start = 100 if len(lines) <= 2 else 80
    for i, line in enumerate(lines[:3]):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (400 - text_width) // 2
        y = y_start + (i * 40)
        draw.text((x, y), line, fill=(255, 255, 255), font=font)
    
    output = BytesIO()
    img.save(output, format='PNG')
    output.seek(0)
    return output

# Get all published articles
articles = Article.objects.filter(is_published=True).order_by('id')
print(f"Processing {articles.count()} articles...\n")

generated = 0
already_exist = 0

for article in articles:
    title = article.title_en or article.title_id
    
    # Create a clean filename
    clean_title = title[:20].lower()
    clean_title = clean_title.replace(' ', '_').replace('/', '_').replace(':', '_')
    filename = f"article_{article.id}_{clean_title}.png"
    
    file_path = media_dir / filename
    
    # Check if file already exists
    if file_path.exists():
        already_exist += 1
        print(f"✓ Article {article.id}: File already exists - {filename}")
    else:
        # Generate the image
        try:
            image_content = create_article_image(title, article.category_id)
            
            # Save the file directly
            with open(file_path, 'wb') as f:
                f.write(image_content.getvalue())
            
            # Update database to point to this file
            db_path = f"articles/{filename}"
            article.image.name = db_path
            article.save(update_fields=['image'])
            
            generated += 1
            print(f"✓ Article {article.id}: Generated {filename}")
        except Exception as e:
            print(f"✗ Article {article.id}: ERROR - {str(e)}")

print(f"\n" + "=" * 80)
print(f"Generated: {generated} new images")
print(f"Already existed: {already_exist}")
print(f"Total: {generated + already_exist} / {articles.count()}")

# Verify all files exist
print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

missing = 0
for article in articles:
    if article.image:
        # Get the expected file path
        image_name = article.image.name
        file_path = Path(article.image.path) if hasattr(article.image, 'path') else Path(f"media/{image_name}")
        
        if not file_path.exists():
            missing += 1
            print(f"✗ Article {article.id}: File missing - {image_name}")

if missing == 0:
    print(f"✅ ALL {articles.count()} ARTICLE IMAGES READY!")
else:
    print(f"⚠️  {missing} images still missing")
