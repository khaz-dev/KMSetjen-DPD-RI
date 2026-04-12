#!/bin/bash
# ==============================================================================
# Django Application Entrypoint
# Handles database migrations and initial setup on container start
# ==============================================================================

set -e

echo "=========================================="
echo "🚀 KMS Django Initialization"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-localhost} ${DB_PORT:-5432}; do
  sleep 1
done
echo "✓ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
while ! nc -z ${REDIS_HOST:-localhost} ${REDIS_PORT:-6382}; do
  sleep 1  
done
echo "✓ Redis is ready"

# Run migrations
echo "📦 Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create admin user if it doesn't exist
echo "👤 Checking admin user..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()

admin_exists = User.objects.filter(username='khaz_prod', is_superuser=True).exists()

if not admin_exists:
    print("  → Creating default admin user...")
    # Use the create_admin command
    from django.core.management import call_command
    try:
        # Try to use random password generation
        call_command('create_admin', '--generate')
        print("  ✓ Admin user created with auto-generated password")
    except Exception as e:
        print(f"  ⚠ Warning: Could not create admin user: {e}")
        print("  Manual creation required: python manage.py create_admin --generate")
else:
    print("  ✓ Admin user already exists")
END

# Populate database with seed data if core data is missing
echo "🌱 Checking for seed data..."
python manage.py shell << END
from apps.core.models import Role, Language, Category, Tag

# Check if seed data exists
languages_exist = Language.objects.exists()
roles_exist = Role.objects.exists()
categories_exist = Category.objects.exists()
tags_exist = Tag.objects.exists()

if not (languages_exist and roles_exist and categories_exist and tags_exist):
    print("  → Seed data missing. Running seeding commands...")
    from django.core.management import call_command
    try:
        print("    • Populating core reference data (Languages, Roles, Categories, Tags)...")
        call_command('seed_data')
        print("    ✓ Core reference data created")
    except Exception as e:
        print(f"    ⚠ Warning: Could not seed core data: {e}")
else:
    print("  ✓ Seed data already exists")
END

# Populate comprehensive articles and extended content
echo "📰 Populating comprehensive content..."
python manage.py shell << END
from apps.content.models import Article

# Check if articles exist
articles_exist = Article.objects.filter(is_published=True).exists()

if not articles_exist:
    print("  → Articles missing. Running comprehensive seeding...")
    from django.core.management import call_command
    try:
        print("    • Creating comprehensive articles with bilingual content...")
        call_command('seed_comprehensive', '--noinput')
        print("    ✓ Comprehensive articles created")
    except Exception as e:
        print(f"    ⚠ Warning: Could not create comprehensive articles: {e}")
else:
    print("  ✓ Articles already exist")
END

# Ensure all tags are properly associated with articles
echo "🏷️  Ensuring tags are associated with articles..."
python manage.py shell << END
from apps.content.models import Tag, Article

# Check if tags have associated articles
tags_with_articles = False
try:
    tags_with_articles = Article.tags.through.objects.exists()
except:
    pass

if not tags_with_articles:
    print("  → Tag associations missing. Running populate_tags...")
    from django.core.management import call_command
    try:
        call_command('populate_tags')
        print("    ✓ Tags associated with articles")
    except Exception as e:
        print(f"    ⚠ Warning: Could not populate tags: {e}")
else:
    print("  ✓ Tag associations already exist")
END

echo ""
echo "=========================================="
echo "✅ Django Ready!"
echo "=========================================="
echo ""

# Start Django application
exec "$@"
