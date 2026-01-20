#!/usr/bin/env python
"""Add File attachments to demonstrate embedded files in KMS."""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, File
from django.contrib.auth import get_user_model

User = get_user_model()

# Get files to add
files_to_add = [
    {
        "article_id": 1,
        "original_filename": "KMS_User_Guide_v1.0.pdf",
        "file_size": 2457600,  # 2.4 MB
        "mime_type": "application/pdf",
        "description_id": "Panduan lengkap pengguna KMS dengan screenshot dan tutorial",
        "description_en": "Complete KMS user guide with screenshots and tutorials"
    },
    {
        "article_id": 2,
        "original_filename": "Security_Protocols_Checklist.docx",
        "file_size": 524800,  # 512 KB
        "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "description_id": "Checklist protokol keamanan untuk departemen",
        "description_en": "Security protocol checklist for departments"
    },
    {
        "article_id": 2,
        "original_filename": "Data_Encryption_Standards.xlsx",
        "file_size": 1024000,  # 1 MB
        "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "description_id": "Standar enkripsi dan key management",
        "description_en": "Encryption standards and key management"
    },
    {
        "article_id": 3,
        "original_filename": "API_Reference_v2.1.pdf",
        "file_size": 3145728,  # 3 MB
        "mime_type": "application/pdf",
        "description_id": "Dokumentasi API lengkap dengan endpoint reference",
        "description_en": "Complete API documentation with endpoint reference"
    },
    {
        "article_id": 3,
        "original_filename": "Integration_Examples.zip",
        "file_size": 5242880,  # 5 MB
        "mime_type": "application/zip",
        "description_id": "Kode contoh integrasi dalam berbagai bahasa pemrograman",
        "description_en": "Integration code examples in various programming languages"
    },
    {
        "article_id": 4,
        "original_filename": "Q1_2026_Analytics_Report.xlsx",
        "file_size": 2097152,  # 2 MB
        "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "description_id": "Data analytics terperinci dengan pivot tables dan charts",
        "description_en": "Detailed analytics data with pivot tables and charts"
    },
    {
        "article_id": 4,
        "original_filename": "Q1_2026_Executive_Summary.pdf",
        "file_size": 1572864,  # 1.5 MB
        "mime_type": "application/pdf",
        "description_id": "Ringkasan eksekutif untuk kepemimpinan senior",
        "description_en": "Executive summary for senior leadership"
    },
    {
        "article_id": 5,
        "original_filename": "Article_Writing_Template.docx",
        "file_size": 512000,  # 500 KB
        "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "description_id": "Template siap pakai untuk membuat artikel baru",
        "description_en": "Ready-to-use template for creating new articles"
    },
    {
        "article_id": 5,
        "original_filename": "SEO_Optimization_Checklist.pdf",
        "file_size": 524288,  # 512 KB
        "mime_type": "application/pdf",
        "description_id": "Checklist optimasi SEO untuk content creators",
        "description_en": "SEO optimization checklist for content creators"
    },
    {
        "article_id": 6,
        "original_filename": "University_Partnership_Agreement.pdf",
        "file_size": 4194304,  # 4 MB
        "mime_type": "application/pdf",
        "description_id": "Dokumen perjanjian kerjasama strategis dengan universitas",
        "description_en": "Strategic cooperation agreement document with university"
    },
    {
        "article_id": 6,
        "original_filename": "Collaboration_Proposal_2026.pptx",
        "file_size": 3670016,  # 3.5 MB
        "mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "description_id": "Presentasi proposal kolaborasi 2026 dengan slide-slide detail",
        "description_en": "2026 collaboration proposal presentation with detailed slides"
    }
]

print("\n" + "="*80)
print("ADDING FILE ATTACHMENTS TO ARTICLES")
print("="*80 + "\n")

# Get a user for the uploader (usually admin or system)
try:
    uploader = User.objects.filter(is_superuser=True).first()
    if not uploader:
        uploader = User.objects.first()
    print(f"📁 Using uploader: {uploader.username if uploader else 'System'}\n")
except:
    uploader = None

added_count = 0
for file_data in files_to_add:
    article = Article.objects.filter(id=file_data["article_id"]).first()
    
    if not article:
        print(f"⚠️  Article ID {file_data['article_id']} not found, skipping file {file_data['original_filename']}")
        continue
    
    # Check if file already exists
    existing = File.objects.filter(
        article_id=file_data["article_id"],
        original_filename=file_data["original_filename"]
    ).exists()
    
    if existing:
        print(f"⏭️  File already exists: {file_data['original_filename']} (Article {file_data['article_id']})")
        continue
    
    try:
        file_obj = File.objects.create(
            article_id=file_data["article_id"],
            original_filename=file_data["original_filename"],
            file_size=file_data["file_size"],
            mime_type=file_data["mime_type"],
            description_id=file_data["description_id"],
            description_en=file_data["description_en"],
            uploaded_by=uploader,
            order_index=added_count
        )
        added_count += 1
        file_size_mb = file_data["file_size"] / (1024*1024)
        print(f"✅ Added: {file_data['original_filename']} ({file_size_mb:.1f} MB) → Article {file_data['article_id']}")
    except Exception as e:
        print(f"❌ Error adding {file_data['original_filename']}: {str(e)}")

print("\n" + "="*80)
print(f"✅ SUCCESS: {added_count} file attachments added!")
print("="*80)
print("\n📦 Files now available in articles:")
print("   • Article 1 (KMS Guide): 1 PDF guide")
print("   • Article 2 (Security): 2 files (checklist + standards)")
print("   • Article 3 (API): 2 files (reference + code examples)")
print("   • Article 4 (Analytics): 2 files (data + executive summary)")
print("   • Article 5 (Tutorial): 2 files (template + checklist)")
print("   • Article 6 (News): 2 files (agreement + presentation)")
print("\n💾 Total file size range: 512 KB - 5 MB per file")
print("📋 File types: PDF, DOCX, XLSX, PPTX, ZIP")
print("\n" + "="*80)
