#!/bin/bash

################################################################################
# Django Migration Diagnostics Script
################################################################################
# This script diagnoses migration issues in the KMS deployment
# Usage: ./diagnose_migrations.sh
################################################################################

set -e

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Django Migration Diagnostics${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ==============================================================================
# Check Docker status
# ==============================================================================
echo -e "${BLUE}1. Checking Docker and Container Status...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"
fi

if ! docker-compose ps &> /dev/null; then
    echo -e "${YELLOW}⚠ Containers may not be running${NC}"
    echo "  Running: docker-compose ps"
    docker-compose ps
else
    echo -e "${GREEN}✓ Containers status:${NC}"
    docker-compose ps | head -5
fi

echo ""

# ==============================================================================
# Check Django container
# ==============================================================================
echo -e "${BLUE}2. Checking Django Container...${NC}"
echo ""

if docker-compose ps django | grep -q "Up"; then
    echo -e "${GREEN}✓ Django container is running${NC}"
else
    echo -e "${RED}✗ Django container is NOT running!${NC}"
    echo "  Available containers:"
    docker-compose ps
    exit 1
fi

echo ""

# ==============================================================================
# Check Python and Django
# ==============================================================================
echo -e "${BLUE}3. Checking Python and Django...${NC}"
echo ""

if docker-compose exec -T django python --version &> /dev/null; then
    PYTHON_VERSION=$(docker-compose exec -T django python --version 2>&1)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python not found in Django container!${NC}"
    exit 1
fi

if docker-compose exec -T django python -m django --version &> /dev/null; then
    DJANGO_VERSION=$(docker-compose exec -T django python -m django --version 2>&1)
    echo -e "${GREEN}✓ Django found: $DJANGO_VERSION${NC}"
else
    echo -e "${RED}✗ Django not found in container!${NC}"
    exit 1
fi

echo ""

# ==============================================================================
# Check database connection
# ==============================================================================
echo -e "${BLUE}4. Checking Database Connection...${NC}"
echo ""

echo "  Running: python manage.py dbshell (ping)"
if docker-compose exec -T django python manage.py dbshell -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection FAILED!${NC}"
    echo ""
    echo "  Database Configuration:"
    docker-compose exec -T django python -c "
import os
print(f'  DB_ENGINE: {os.environ.get(\"DB_ENGINE\")}')
print(f'  DB_NAME: {os.environ.get(\"DB_NAME\")}')
print(f'  DB_USER: {os.environ.get(\"DB_USER\")}')
print(f'  DB_HOST: {os.environ.get(\"DB_HOST\")}')
print(f'  DB_PORT: {os.environ.get(\"DB_PORT\")}')
"
    echo ""
    echo "  Troubleshooting:"
    echo "  1. Is PostgreSQL running and accessible?"
    echo "  2. Check if DB_HOST is correct (should be 'host.docker.internal' in Docker)"
    echo "  3. Check if database credentials are correct"
    echo "  4. Check database permissions"
fi

echo ""

# ==============================================================================
# Check migrations table
# ==============================================================================
echo -e "${BLUE}5. Checking Migration Table...${NC}"
echo ""

if docker-compose exec -T django python manage.py migrate --check 2>&1 | grep -q "django_migrations"; then
    echo -e "${GREEN}✓ Migration table exists${NC}"
else
    echo "  Checking if migrations table exists..."
    docker-compose exec -T django python -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT tablename FROM pg_tables WHERE schemaname='public';\" if 'postgresql' in str(connection.settings_dict['ENGINE']).lower() else \"SELECT name FROM sqlite_master WHERE type='table';\")
tables = [row[0] for row in cursor.fetchall()]
if 'django_migrations' in tables:
    print('✓ Migration table exists')
else:
    print('✗ Migration table NOT found!')
    print(f'  Available tables: {tables[:10]}')
" 2>&1 || echo "  Could not check migration table"
fi

echo ""

# ==============================================================================
# List current migrations
# ==============================================================================
echo -e "${BLUE}6. Checking Applied Migrations...${NC}"
echo ""

echo "  Applied migrations:"
docker-compose exec -T django python manage.py showmigrations --list 2>&1 | grep "\[X\]" | head -20
echo ""
echo "  Pending migrations:"
docker-compose exec -T django python manage.py showmigrations --list 2>&1 | grep "\[ \]" | head -20

echo ""

# ==============================================================================
# Run migration check
# ==============================================================================
echo -e "${BLUE}7. Running Migration Check...${NC}"
echo ""

echo "  Command: python manage.py migrate --check"
if docker-compose exec -T django python manage.py migrate --check 2>&1; then
    echo -e "${GREEN}✓ All migrations are applied${NC}"
else
    echo -e "${YELLOW}⚠ Migration check indicates pending migrations${NC}"
fi

echo ""

# ==============================================================================
# Check for migration conflicts
# ==============================================================================
echo -e "${BLUE}8. Checking for Migration Conflicts...${NC}"
echo ""

if docker-compose exec -T django python manage.py makemigrations --check --dry-run 2>&1 | grep -q "No changes detected"; then
    echo -e "${GREEN}✓ No conflicting migrations detected${NC}"
else
    echo -e "${YELLOW}⚠ Potential migration issues detected${NC}"
    docker-compose exec -T django python manage.py makemigrations --check --dry-run 2>&1 | head -20
fi

echo ""

# ==============================================================================
# Test migration run (without actually executing)
# ==============================================================================
echo -e "${BLUE}9. Testing Migration Execution (Dry Run)...${NC}"
echo ""

echo "  Running: python manage.py migrate --plan"
docker-compose exec -T django python manage.py migrate --plan 2>&1 | head -30

echo ""

# ==============================================================================
# Check application state
# ==============================================================================
echo -e "${BLUE}10. Running Application Check...${NC}"
echo ""

echo "  Command: python manage.py check"
if docker-compose exec -T django python manage.py check; then
    echo -e "${GREEN}✓ Application check passed${NC}"
else
    echo -e "${RED}✗ Application check FAILED!${NC}"
fi

echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Diagnostic Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "If migrations are not running:"
echo "1. Check the database connection above"
echo "2. Run manually: docker-compose exec -T django python manage.py migrate --noinput"
echo "3. Check logs: docker-compose logs django"
echo "4. Verify .env has correct DB_HOST (should be 'host.docker.internal' in Docker)"
echo ""
echo "For production servers:"
echo "1. Update DB_HOST in .env to your PostgreSQL server"
echo "2. Ensure PostgreSQL is accessible from the Docker container"
echo "3. Check PostgreSQL user permissions"
echo "4. Test connection manually first"
echo ""
