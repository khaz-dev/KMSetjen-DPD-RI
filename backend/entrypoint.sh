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

admin_exists = User.objects.filter(username='admin_prod', is_superuser=True).exists()

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

echo ""
echo "=========================================="
echo "✅ Django Ready!"
echo "=========================================="
echo ""

# Start Django application
exec "$@"
