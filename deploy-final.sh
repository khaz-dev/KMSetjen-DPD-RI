#!/bin/bash

################################################################################
# FINAL - KMSetjen DPD RI COMPLETE DEPLOYMENT SCRIPT
# ============================================================================
# Staging Server: Ubuntu 24.04 LTS (143.198.200.57)
# Domain: https://khaz.app/kmsetjendpdri
# This is a COMPREHENSIVE script that handles ALL deployment steps
################################################################################

set -e  # Exit immediately if a command fails

# =============================================================================
# COLOR OUTPUT & LOGGING
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

log_header() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC}     $1"
}

log_success() {
    echo -e "${GREEN}[✓ OK]${NC}     $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC}     $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC}    $1"
    exit 1
}

log_step() {
    echo -e "${BLUE}→${NC} $1"
}

# =============================================================================
# CONFIGURATION
# =============================================================================
PROJECT_DIR="/var/www/html/kmsetjendpdri"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
GUNICORN_PORT="8002"
GUNICORN_WORKERS="4"
SYSTEMD_SERVICE="/etc/systemd/system/kmsetjendpdri-gunicorn.service"
NGINX_AVAILABLE="/etc/nginx/sites-available/kmsetjendpdri"
NGINX_ENABLED="/etc/nginx/sites-enabled/kmsetjendpdri"

# =============================================================================
# REQUIREMENT CHECKS
# =============================================================================
log_header "DEPLOYMENT REQUIREMENT CHECKS"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root. Use: sudo ./deploy-final.sh"
fi
log_success "Running as root"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory not found: $PROJECT_DIR"
fi
log_success "Project directory exists: $PROJECT_DIR"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_error "Missing .env file at $PROJECT_DIR/.env"
fi
log_success "Environment file exists"

# Check if .env contains required variables
required_vars=("SECRET_KEY" "DB_PASSWORD" "ALLOWED_HOSTS")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" "$PROJECT_DIR/.env"; then
        log_error "Required environment variable missing: $var"
    fi
done
log_success "All required environment variables present"

# =============================================================================
# SYSTEM DEPENDENCIES INSTALLATION
# =============================================================================
log_header "INSTALLING SYSTEM DEPENDENCIES"

log_step "Updating package manager..."
apt-get update -qq
log_success "Package manager updated"

# Check and install required packages
required_packages=("curl" "wget" "git" "python3-pip" "python3-venv" "nodejs" "npm" "postgresql" "postgresql-contrib" "redis-server" "nginx")

log_step "Installing required packages..."
for package in "${required_packages[@]}"; do
    if ! dpkg -l | grep -q "^ii.*$package"; then
        log_info "Installing $package..."
        apt-get install -y "$package" > /dev/null 2>&1
    fi
done
log_success "All required packages installed"

# =============================================================================
# DATABASE SETUP
# =============================================================================
log_header "DATABASE SETUP"

log_step "Ensuring PostgreSQL is running..."
if ! systemctl is-active --quiet postgresql; then
    log_info "Starting PostgreSQL..."
    systemctl start postgresql
fi
log_success "PostgreSQL is running"

log_step "Checking if database exists..."
export PGPASSWORD=$(grep "^DB_PASSWORD=" "$PROJECT_DIR/.env" | cut -d= -f2)
DB_USER=$(grep "^DB_USER=" "$PROJECT_DIR/.env" | cut -d= -f2 || echo "postgres")
DB_NAME=$(grep "^DB_NAME=" "$PROJECT_DIR/.env" | cut -d= -f2 || echo "kmsdb")

if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_warning "Database already exists, will perform migrations"
else
    log_info "Creating new database and user..."
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$PGPASSWORD';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET default_transaction_deferrable TO on;
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    log_success "Database and user created"
fi

# =============================================================================
# REDIS SETUP
# =============================================================================
log_header "REDIS CACHE SETUP"

log_step "Ensuring Redis is running..."
if ! systemctl is-active --quiet redis-server; then
    log_info "Starting Redis..."
    systemctl start redis-server
fi
log_success "Redis is running"

# =============================================================================
# FRONTEND BUILD
# =============================================================================
log_header "FRONTEND BUILD"

log_step "Navigating to frontend directory..."
cd "$FRONTEND_DIR" || log_error "Cannot access frontend directory"

log_step "Installing Node.js dependencies..."
npm install --production --silent 2>&1 | grep -v "^npm" || true
log_success "Dependencies installed"

log_step "Building React application..."
npm run build 2>&1 | grep -v "^npm" || true

if [ ! -d "$FRONTEND_DIR/dist" ]; then
    log_error "Frontend build failed - dist directory not created"
fi
log_success "Frontend built successfully"

# Count built files
file_count=$(find "$FRONTEND_DIR/dist" -type f | wc -l)
log_info "Generated $file_count frontend files"

# =============================================================================
# BACKEND SETUP
# =============================================================================
log_header "BACKEND SETUP"

log_step "Navigating to backend directory..."
cd "$BACKEND_DIR" || log_error "Cannot access backend directory"

log_step "Creating Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    log_success "Virtual environment created"
else
    log_warning "Virtual environment already exists"
fi

log_step "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

log_step "Upgrading pip..."
pip install --quiet --upgrade pip setuptools wheel
log_success "Pip upgraded"

log_step "Installing Python dependencies..."
pip install --quiet -r requirements.txt
log_success "Python dependencies installed"

# Source .env for Django commands
export $(cat "$PROJECT_DIR/.env" | grep -v '#' | xargs)
export DJANGO_SETTINGS_MODULE=config.settings

log_step "Running Django migrations..."
python manage.py migrate
log_success "Migrations completed"

log_step "Collecting static files..."
python manage.py collectstatic --clear --noinput
log_success "Static files collected"

log_step "Verifying database connection..."
python manage.py dbshell > /dev/null 2>&1 << EOF
SELECT 1;
EOF
log_success "Database connection verified"

# =============================================================================
# GUNICORN SYSTEMD SERVICE
# =============================================================================
log_header "GUNICORN APPLICATION SERVER"

log_step "Creating systemd service file..."
cat > "$SYSTEMD_SERVICE" << EOF
[Unit]
Description=Gunicorn WSGI - KMSetjen DPD RI
After=network.target
Documentation=https://khaz.app/kmsetjendpdri

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$VENV_DIR/bin"
EnvironmentFile=$PROJECT_DIR/.env

# Gunicorn configuration
ExecStart=$VENV_DIR/bin/gunicorn \
    --workers $GUNICORN_WORKERS \
    --worker-class sync \
    --bind 127.0.0.1:$GUNICORN_PORT \
    --timeout 120 \
    --access-logfile /var/log/kmsetjendpdri-gunicorn-access.log \
    --error-logfile /var/log/kmsetjendpdri-gunicorn-error.log \
    config.wsgi:application

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kmsetjendpdri-gunicorn

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SYSTEMD_SERVICE"
log_success "Systemd service created"

log_step "Reloading systemd daemon..."
systemctl daemon-reload
log_success "Systemd daemon reloaded"

log_step "Enabling gunicorn service..."
systemctl enable kmsetjendpdri-gunicorn.service
log_success "Gunicorn service enabled"

log_step "Starting gunicorn service..."
systemctl restart kmsetjendpdri-gunicorn.service
sleep 2
log_success "Gunicorn service started"

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================
log_header "NGINX WEB SERVER"

log_step "Copying nginx configuration..."
cp "$PROJECT_DIR/nginx-kmsetjendpdri-config.conf" "$NGINX_AVAILABLE"
chmod 644 "$NGINX_AVAILABLE"
log_success "Nginx config copied"

log_step "Enabling site..."
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    log_success "Site enabled"
else
    log_success "Site already enabled"
fi

log_step "Disabling default site..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm -f "/etc/nginx/sites-enabled/default"
    log_success "Default site disabled"
else
    log_success "Default site not enabled"
fi

log_step "Testing nginx configuration..."
if ! nginx -t 2>&1 | grep -q "success"; then
    log_error "Nginx configuration test failed"
fi
log_success "Nginx configuration valid"

log_step "Restarting nginx..."
systemctl restart nginx
sleep 2
log_success "Nginx restarted"

# =============================================================================
# FILE PERMISSIONS & OWNERSHIP
# =============================================================================
log_header "FILE PERMISSIONS & SECURITY"

log_step "Setting ownership and permissions..."
chown -R www-data:www-data "$PROJECT_DIR"
chmod 755 "$PROJECT_DIR"

# Make .env readable only by www-data
chmod 600 "$PROJECT_DIR/.env"
chown www-data:www-data "$PROJECT_DIR/.env"

# Ensure media directory exists and is writable
mkdir -p "$BACKEND_DIR/media" "$BACKEND_DIR/logs"
chown www-data:www-data "$BACKEND_DIR/media" "$BACKEND_DIR/logs"
chmod 755 "$BACKEND_DIR/media" "$BACKEND_DIR/logs"

log_success "Permissions and ownership set"

# =============================================================================
# FIREWALL RULES
# =============================================================================
log_header "FIREWALL CONFIGURATION"

if command -v ufw &> /dev/null; then
    log_step "Configuring UFW firewall..."
    ufw allow 22/tcp 2>/dev/null || true       # SSH
    ufw allow 80/tcp 2>/dev/null || true       # HTTP
    ufw allow 443/tcp 2>/dev/null || true      # HTTPS
    log_success "Firewall rules configured"
else
    log_warning "UFW not found, skipping firewall configuration"
fi

# =============================================================================
# VERIFICATION & HEALTH CHECKS
# =============================================================================
log_header "DEPLOYMENT VERIFICATION"

# Wait for services to stabilize
sleep 2

# Check PostgreSQL
log_step "Checking PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL: ACTIVE"
else
    log_error "PostgreSQL: FAILED"
fi

# Check Redis
log_step "Checking Redis..."
if systemctl is-active --quiet redis-server; then
    log_success "Redis: ACTIVE"
else
    log_error "Redis: FAILED"
fi

# Check Gunicorn
log_step "Checking Gunicorn..."
if systemctl is-active --quiet kmsetjendpdri-gunicorn; then
    log_success "Gunicorn: ACTIVE"
else
    log_error "Gunicorn: FAILED - Check logs: systemctl status kmsetjendpdri-gunicorn"
fi

# Check Nginx
log_step "Checking Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx: ACTIVE"
else
    log_error "Nginx: FAILED - Check logs: systemctl status nginx"
fi

# Check if port 8002 is listening
log_step "Checking if Gunicorn is listening on port 8002..."
if netstat -tlnp 2>/dev/null | grep -q ":8002 "; then
    log_success "Port 8002: LISTENING"
else
    log_warning "Port 8002 not listening - may take a moment to start"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
log_header "DEPLOYMENT COMPLETE ✓"

echo -e "${GREEN}Your KMSetjen DPD RI application is now deployed!${NC}"
echo ""
echo -e "${BLUE}Access Point:${NC}"
echo "  → https://khaz.app/kmsetjendpdri/"
echo ""
echo -e "${BLUE}Service Management:${NC}"
echo "  → Start:   sudo systemctl start kmsetjendpdri-gunicorn"
echo "  → Stop:    sudo systemctl stop kmsetjendpdri-gunicorn"
echo "  → Restart: sudo systemctl restart kmsetjendpdri-gunicorn"
echo "  → Status:  systemctl status kmsetjendpdri-gunicorn"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  → Gunicorn:    sudo journalctl -u kmsetjendpdri-gunicorn -f"
echo "  → Nginx error: sudo tail -f /var/log/nginx/kmsetjendpdri_error.log"
echo "  → Django:      tail -f $BACKEND_DIR/logs/django.log"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Create admin user:"
echo "     cd $BACKEND_DIR && source venv/bin/activate"
echo "     python manage.py createsuperuser"
echo ""
echo "  2. Access Django Admin:"
echo "     → https://khaz.app/kmsetjendpdri/admin/"
echo ""
echo "  3. Verify application:"
echo "     → Visit https://khaz.app/kmsetjendpdri/ in browser"
echo "     → Check browser console for errors"
echo "     → Test API calls"
echo ""
echo -e "${YELLOW}Important Security Reminders:${NC}"
echo "  ✓ Change SECRET_KEY to a random 50+ character string"
echo "  ✓ Set DEBUG=False in production"
echo "  ✓ Use strong database and Redis passwords"
echo "  ✓ Keep /.env file permissions restricted (600)"
echo "  ✓ Set up automated SSL certificate renewal"
echo "  ✓ Configure regular database backups"
echo ""
echo -e "${GREEN}Deployment Status: SUCCESS ✓${NC}"
echo ""
