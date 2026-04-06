#!/bin/bash

# ============================================================================
# KMSetjen DPD RI - Docker Deployment Script
# ============================================================================
# This script automates the deployment of KMSetjen DPD RI using Docker Compose
# Usage: bash ./deploy-docker.sh
# ============================================================================

set -e

print_header() {
    echo ""
    echo "=========================================================================="
    echo "$1"
    echo "=========================================================================="
}

print_step() {
    echo ""
    echo ">>> $1"
}

print_success() {
    echo "✓ $1"
}

print_error() {
    echo "✗ ERROR: $1"
    exit 1
}

# Verify we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Run this script from the project root."
fi

cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

print_header "KMSetjen DPD RI - Automated Docker Deployment"

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
print_step "Checking Prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker not installed. Please install Docker first."
fi
print_success "Docker installed: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose not installed. Please install Docker Compose first."
fi
print_success "Docker Compose installed: $(docker-compose --version)"

# ============================================================================
# Step 2: Setup Environment File
# ============================================================================
print_step "Setting up Environment File (.env)"

if [ ! -f ".env" ]; then
    print_error ".env file not found. Please copy from .env.example or create one."
fi

# Verify critical env vars
if ! grep -q "SECRET_KEY=" .env; then
    print_error "SECRET_KEY not set in .env"
fi

if ! grep -q "DB_PASSWORD=" .env; then
    print_error "DB_PASSWORD not set in .env"
fi

print_success ".env file is properly configured"

# ============================================================================
# Step 3: Build Frontend
# ============================================================================
print_step "Building Frontend (React/Vite)"

cd "$PROJECT_ROOT/frontend"

if [ ! -f "package-lock.json" ]; then
    npm install --legacy-peer-deps
fi

npm ci --legacy-peer-deps
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Frontend build failed - dist/index.html not found"
fi

print_success "Frontend built successfully at $(pwd)/dist/"

# ============================================================================
# Step 4: Build Docker Images
# ============================================================================
print_step "Building Docker Images"

cd "$PROJECT_ROOT"

print_step "Building Django image..."
docker-compose build kms_django

print_step "Building Frontend image..."
docker-compose build kms_frontend

print_success "Docker images built successfully"

# ============================================================================
# Step 5: Start Containers
# ============================================================================
print_step "Starting Docker Containers"

docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for services to start
print_step "Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check status
STATUS=$(docker-compose ps -q | wc -l)
if [ "$STATUS" -eq 0 ]; then
    print_error "No containers started. Check docker-compose logs."
fi

print_success "Containers started"
docker-compose ps

# ============================================================================
# Step 6: Run Django Migrations
# ============================================================================
print_step "Running Django Migrations"

docker-compose exec -T kms_django python manage.py migrate

print_success "Migrations completed"

# ============================================================================
# Step 7: Collect Static Files
# ============================================================================
print_step "Collecting Django Static Files"

docker-compose exec -T kms_django python manage.py collectstatic --noinput

print_success "Static files collected"

# ============================================================================
# Step 8: Verify Health Checks
# ============================================================================
print_step "Verifying Container Health"

# Django health
if docker-compose exec -T kms_django curl -f http://localhost:8002/health/ > /dev/null 2>&1; then
    print_success "Django is healthy"
else
    print_error "Django health check failed"
fi

# Redis health
if docker-compose exec -T kms_redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d= -f2)" ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
fi

# ============================================================================
# Step 9: Display Summary
# ============================================================================
print_header "Deployment Complete!"

echo ""
echo "Application Status:"
echo "  Frontend: http://localhost:5175"
echo "  Backend API: http://localhost:8002/api"
echo "  Django Admin: http://localhost:8002/admin"
echo ""
echo "Production URL: https://khaz.app/kmsetjendpdri/"
echo ""
echo "Next Steps:"
echo "  1. Configure Nginx reverse proxy (if not already done)"
echo "  2. Setup SSL certificates (Let's Encrypt)"
echo "  3. Test application at https://khaz.app/kmsetjendpdri/"
echo ""
echo "Useful Commands:"
echo "  docker-compose logs -f              # Follow all logs"
echo "  docker-compose logs -f kms_django   # Follow Django logs"
echo "  docker-compose ps                   # View container status"
echo "  docker-compose restart kms_django   # Restart Django"
echo ""
echo "Documentation: See DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md"
echo ""
