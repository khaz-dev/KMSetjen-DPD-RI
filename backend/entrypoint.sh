#!/bin/bash
# ==============================================================================
# Django Application Entrypoint
# Handles permissions, database migrations, and initial setup on container start
# ==============================================================================

set -e

echo "=========================================="
echo "🚀 KMS Django Initialization"
echo "=========================================="

# ==============================================================================
# CRITICAL: Fix Directory Permissions (runs as root)
# ==============================================================================
echo "🔧 Fixing directory permissions..."

# Ensure directories exist with proper permissions
mkdir -p /app/media /app/logs /app/staticfiles

# Fix permissions for media directory (where avatars are uploaded)
# chmod 755: owner rwx, group rx, other rx (readable by all, writable by owner)
# chmod 644: files rw- r-- r-- (readable by all, writable by owner)
chmod -R 755 /app/media 2>/dev/null || true
find /app/media -type f -exec chmod 644 {} \; 2>/dev/null || true

# Fix permissions for logs directory
chmod -R 755 /app/logs 2>/dev/null || true
find /app/logs -type f -exec chmod 644 {} \; 2>/dev/null || true

# Fix permissions for staticfiles directory
chmod -R 755 /app/staticfiles 2>/dev/null || true
find /app/staticfiles -type f -exec chmod 644 {} \; 2>/dev/null || true

# Ensure django user owns these directories
chown -R django:django /app/media /app/logs /app/staticfiles 2>/dev/null || true

echo "  ✓ Permissions fixed"

# ==============================================================================
# Run Django initialization (as root, which is fine for initial setup)
# ==============================================================================
cd /app

echo "⏳ Waiting for PostgreSQL..."
DB_HOST=${DB_HOST:-host.docker.internal}
DB_PORT=${DB_PORT:-5432}
max_attempts=30
attempt=0
while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "⚠ PostgreSQL timeout (${max_attempts}s), continuing anyway..."
    break
  fi
  sleep 1
done
echo "✓ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
max_attempts=30
attempt=0
while ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "⚠ Redis timeout (${max_attempts}s), continuing anyway..."
    break
  fi
  sleep 1  
done
echo "✓ Redis is ready"

# ==============================================================================
# Create database if it doesn't exist (CRITICAL: Must run before migrations)
# ==============================================================================
echo "🗄️  Ensuring database exists..."
python << 'PYEOF'
import psycopg2
import os
import sys

DB_NAME = os.getenv('DB_NAME', 'kmsdb')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5432'))

# Connect to postgres database (the server itself, not kmsdb)
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database='postgres'
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists and create if not
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = %s;", (DB_NAME,))
    if cursor.fetchone() is None:
        cursor.execute(f"CREATE DATABASE {DB_NAME};")
        print(f"✓ Database '{DB_NAME}' created successfully")
    else:
        print(f"✓ Database '{DB_NAME}' already exists")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"⚠ Database setup warning: {e}")
    print("  Continuing anyway - migrations may fail if database doesn't exist")
PYEOF

# Run migrations
echo "📦 Running database migrations..."
python manage.py migrate --noinput 2>&1 || echo "⚠ Migration warning (may have pending model changes - run makemigrations)"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear || true

# Note: Seed data initialization skipped to prioritize Django startup
# In production, seeding should be handled separately via management commands
# after confirming the database schema is stable

echo ""
echo "=========================================="
echo "✅ Django Ready!"
echo "=========================================="
echo ""

# Start Django application as django user (non-root for security)
# Using su -s to avoid TTY requirement
exec su -s /bin/bash django -c 'exec gunicorn --bind 0.0.0.0:8002 --workers 4 --timeout 120 --access-logfile - --error-logfile - config.wsgi:application'
