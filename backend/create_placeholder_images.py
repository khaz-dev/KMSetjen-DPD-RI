#!/usr/bin/env python
"""
Create simple placeholder PNG files for articles and categories.
This prevents 404 errors while real images are being uploaded.
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_image(width=400, height=300, text="Image", filename=None):
    """Create a simple placeholder image."""
    # Create a new image with a gradient-like effect
    img = Image.new('RGB', (width, height), color=(20, 184, 166))  # Teal color
    draw = ImageDraw.Draw(img)
    
    # Add text in the center
    text_bbox = draw.textbbox((0, 0), text)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255))
    
    if filename:
        img.save(filename)
        return True
    return img

# Create media directories if they don't exist
media_articles_dir = "backend/media/articles"
media_categories_dir = "backend/media/categories"

os.makedirs(media_articles_dir, exist_ok=True)
os.makedirs(media_categories_dir, exist_ok=True)

print("=" * 80)
print("CREATING PLACEHOLDER IMAGES")
print("=" * 80)

# Article image file names from database
article_files = [
    "article_1_dpd_ri_knowledge_man.png",
    "article_2_organizational_data_.png",
    "article_3_announcement__kms_sy.png",
    "article_4_productivity_tips__e.png",
    "article_5_tutorial_how_to_cre.png",
    "article_6_news__strategic_coll.png",
    "article_7_integrity_and_work_e.png",
    "article_8_organizational_risk_.png",
    "article_9_anti-corruption_and_.png",
    "article_10_whistleblower_protec.png",
    "article_11_announcement__offici.png",
    "article_12_announcement__system.png",
    "article_13_announcement__new_st.png",
    "article_14_guide__how_to_create.png",
    "article_15_tutorial__using_adva.png",
    "article_16_guide_to_creating_st.png",
    "article_17_tutorial__how_to_sha.png",
    "article_18_it_department_perfor.png",
    "article_19_employee_training_pr.png",
    "article_20_customer_satisfactio.png",
    "article_21_news__organization_w.png",
    "article_22_news__partnership_wi.png",
    "Seri_1.png",
]

# Category image file names
category_files = [
    "kebijakan_publik.png",
    "pengumuman.png",
    "panduan_and_tutorial.png",
    "laporan_and_evaluasi.png",
    "berita_and_media.png",
]

print("\n[1/2] Creating article placeholder images...")
for filename in article_files:
    filepath = os.path.join(media_articles_dir, filename)
    if not os.path.exists(filepath):
        create_placeholder_image(text="Article Image", filename=filepath)
        print(f"  ✓ Created: {filename}")
    else:
        print(f"  - Skipped (exists): {filename}")

print(f"\n✓ Created {len(article_files)} article placeholder images")

print("\n[2/2] Creating category placeholder images...")
for filename in category_files:
    filepath = os.path.join(media_categories_dir, filename)
    if not os.path.exists(filepath):
        create_placeholder_image(text="Category Image", filename=filepath)
        print(f"  ✓ Created: {filename}")
    else:
        print(f"  - Skipped (exists): {filename}")

print(f"\n✓ Created {len(category_files)} category placeholder images")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

article_count = len([f for f in os.listdir(media_articles_dir) if f.endswith('.png')])
category_count = len([f for f in os.listdir(media_categories_dir) if f.endswith('.png')])

print(f"\nArticles directory ({media_articles_dir}): {article_count} images")
print(f"Categories directory ({media_categories_dir}): {category_count} images")

print("\n✓ Placeholder images created successfully!")
print("=" * 80)
