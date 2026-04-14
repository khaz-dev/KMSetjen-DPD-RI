#!/bin/bash

################################################################################
# KMS Staging Deployment Script (Linux/Ubuntu)
# For: KMSetjen DPD RI at https://khaz.app/kmsetjendpdri
# 
# USAGE:
#   chmod +x deploy-staging.sh
#   ./deploy-staging.sh
#
# NOTE: Run as root or with sudo privileges
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Configuration
PROJECT_DIR="$(pwd)"  # Auto-detect from current directory
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
GUNICORN_SOCKET="/var/run/gunicorn.sock"
GUNICORN_SYSTEMD="/etc/systemd/system/kms-gunicorn.service"  # Updated for new folder name
NGINX_CONF="/etc/nginx/sites-available/kms"  # Updated for new folder name
NGINX_ENABLED="/etc/nginx/sites-enabled/kms"  # Updated for new folder name

# Functions for colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Banner
echo ""
echo -e "${BLUE}======================================"
echo "KMSetjen DPD RI - STAGING DEPLOYMENT"
echo "======================================${NC}"
echo ""

# ============================================================================
# STEP 1: Check if running as root
# ============================================================================
log_info "Checking permissions..."
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use: sudo ./deploy-staging.sh)"
fi
log_success "Running as root"

# ============================================================================
# STEP 2: Install system dependencies
# ============================================================================
log_info "Installing system dependencies..."
apt update
apt install -y \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    curl \
    git

log_success "System dependencies installed"

# ============================================================================
# STEP 3: Set up database
# ============================================================================
log_info "Setting up PostgreSQL..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    log_warning "PostgreSQL not running, starting..."
    systemctl start postgresql
fi

# Create database and user (if not exists)
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw kmsdb; then
    log_info "Creating PostgreSQL database and user..."
    sudo -u postgres psql << EOF
CREATE DATABASE kmsdb;
CREATE USER postgres WITH PASSWORD 'Okkdpdri@2026';
ALTER ROLE postgres SET client_encoding TO 'utf8';
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET default_transaction_deferrable TO on;
ALTER ROLE postgres SET default_transaction_read_committed TO on;
ALTER ROLE postgres SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE kmsdb TO postgres;
EOF
    log_success "PostgreSQL database and user created"
else
    log_warning "Database already exists, skipping creation"
fi

# ============================================================================
# STEP 4: Set up Redis
# ============================================================================
log_info "Setting up Redis..."
if ! systemctl is-active --quiet redis-server; then
    systemctl start redis-server
    log_success "Redis started"
else
    log_success "Redis already running"
fi

# ============================================================================
# STEP 5: Build Frontend
# ============================================================================
log_info "Building frontend..."
cd $FRONTEND_DIR

# Check Node.js version
NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [[ $NODE_VERSION -lt 16 ]]; then
    log_error "Node.js 16+ required, found version $(node -v)"
fi

# Install and build
log_info "Installing frontend dependencies..."
npm install --production

log_info "Building React app..."
npm run build

log_success "Frontend built successfully"

# ============================================================================
# STEP 6: Set up Backend
# ============================================================================
log_info "Setting up backend..."
cd $BACKEND_DIR

# Create and activate virtual environment
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
log_info "Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists, if not remind user
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_warning "No .env file found!"
    log_info "IMPORTANT: Copy .env.production to .env and update these values:"
    log_info "  - SECRET_KEY (generate a new one: python -c 'import secrets; print(secrets.token_urlsafe(50))')"
    log_info "  - DB_PASSWORD (must match PostgreSQL password)"
    log_info "  - REDIS_PASSWORD (if using Redis)"
    log_info "  - Email credentials"
    log_info "  - Google OAuth credentials"
    log_info ""
    log_info "Create .env now by running:"
    log_info "  cp $PROJECT_DIR/.env.production $PROJECT_DIR/.env"
    log_info "  nano $PROJECT_DIR/.env"
    log_error "Please create .env file and run this script again"
fi

# Make sure .env exists for next commands
export $(cat $PROJECT_DIR/.env | grep -v '#' | xargs)

# Run migrations
log_info "Running Django migrations..."
python manage.py migrate

# Collect static files
log_info "Collecting static files..."
python manage.py collectstatic --noinput

log_success "Backend setup completed"

# ============================================================================
# STEP 7: Create Gunicorn systemd service
# ============================================================================
log_info "Creating Gunicorn systemd service..."

cat > $GUNICORN_SYSTEMD << EOF
[Unit]
Description=Gunicorn application server for KMSetjen DPD RI
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
EnvironmentFile=$PROJECT_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8002 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    config.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

chmod 644 $GUNICORN_SYSTEMD
systemctl daemon-reload
systemctl enable kmsetjendpdri-gunicorn.service
systemctl start kmsetjendpdri-gunicorn.service

log_success "Gunicorn service created and started"

# ============================================================================
# STEP 8: Configure Nginx
# ============================================================================
log_info "Configuring Nginx..."

# Copy Nginx config
cp $PROJECT_DIR/nginx-kmsetjendpdri-config.conf $NGINX_CONF
chmod 644 $NGINX_CONF

# Enable site
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s $NGINX_CONF $NGINX_ENABLED
fi

# Disable default
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx config
log_info "Testing Nginx configuration..."
if ! nginx -t; then
    log_error "Nginx configuration test failed!"
fi

# Reload Nginx
systemctl restart nginx

log_success "Nginx configured and restarted"

# ============================================================================
# STEP 9: Set permissions
# ============================================================================
log_info "Setting file permissions..."

# Ensure www-data can read files
chown -R www-data:www-data $PROJECT_DIR/static* 2>/dev/null || true
chown -R www-data:www-data $BACKEND_DIR/media 2>/dev/null || true
chmod -R 755 $PROJECT_DIR

# Make .env only readable by www-data
chown www-data:www-data $PROJECT_DIR/.env
chmod 600 $PROJECT_DIR/.env

log_success "File permissions set"

# ============================================================================
# STEP 10: Verification
# ============================================================================
log_info "Verifying deployment..."

# Check if services are running
echo ""
echo -e "${BLUE}Service Status:${NC}"
systemctl is-active --quiet postgresql && echo "✓ PostgreSQL running" || echo "✗ PostgreSQL NOT running"
systemctl is-active --quiet redis-server && echo "✓ Redis running" || echo "✗ Redis NOT running"
systemctl is-active --quiet kmsetjendpdri-gunicorn.service && echo "✓ Gunicorn running" || echo "✗ Gunicorn NOT running"
systemctl is-active --quiet nginx && echo "✓ Nginx running" || echo "✗ Nginx NOT running"

echo ""
echo -e "${BLUE}File Locations:${NC}"
echo "Project: $PROJECT_DIR"
echo "Django logs: $BACKEND_DIR/logs/django.log"
echo "Nginx logs: /var/log/nginx/kmsetjendpdri_*.log"
echo "Systemd logs: journalctl -u kmsetjendpdri-gunicorn"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify application at https://khaz.app/kmsetjendpdri"
echo "2. Create superuser: cd $BACKEND_DIR && source venv/bin/activate && python manage.py createsuperuser"
echo "3. Check logs if issues: journalctl -u kmsetjendpdri-gunicorn -f"
echo ""

log_success "Deployment completed!"
echo ""
