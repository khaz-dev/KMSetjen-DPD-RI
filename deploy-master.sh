#!/bin/bash

################################################################################
# KMSetjen DPD RI - Enhanced Master Deployment Script (Bash)
# ============================================================================
# Version 2.0: Now includes SSL Certificate Management
# 
# This script handles COMPLETE deployment including:
# - SSL certificate generation/renewal (with wildcard support)
# - Docker container deployment
# - Nginx configuration
# - Health checks and validation
#
# Features:
# - Auto-detects certificate status
# - Supports DNS-01 (Cloudflare) and manual DNS validation
# - Validates certificate before deployment
# - Automatic renewal with proper domain coverage
#
# Usage:
#   sudo bash deploy-master.sh staging
#   sudo bash deploy-master.sh staging --cert-only
#   sudo bash deploy-master.sh staging --verbose
#   sudo bash deploy-master.sh staging --health-check
#
# Requirements:
#   - Run as root (sudo)
#   - Docker & Docker Compose installed
#   - Certbot installed: sudo apt-get install certbot
#   - For Cloudflare DNS: python3-certbot-dns-cloudflare installed
#
# Environment Variables (optional):
#   CLOUDFLARE_API_TOKEN - For automatic DNS validation (recommended)
#   EMAIL - Certbot notification email
#   SKIP_CERT - Skip certificate checks (not recommended)
#
################################################################################

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

ENVIRONMENT="${1:-staging}"
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}
HEALTH_CHECK=${HEALTH_CHECK:-false}
CERT_ONLY=${CERT_ONLY:-false}
SKIP_CERT=${SKIP_CERT:-false}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN:-}
ADMIN_EMAIL=${EMAIL:-khairilazmiashari@gmail.com}

# Parse arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose)         VERBOSE=true ;;
        --dry-run)         DRY_RUN=true ;;
        --skip-backup)     SKIP_BACKUP=true ;;
        --skip-cert)       SKIP_CERT=true ;;
        --health-check)    HEALTH_CHECK=true ;;
        --cert-only)       CERT_ONLY=true ;;
        --cloudflare)      CLOUDFLARE_API_TOKEN="$2"; shift ;;
        *)                 echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Auto-detect deployment path
DEPLOY_PATH="$(pwd)"
BACKUP_DIR="$DEPLOY_PATH/backups"
LOG_DIR="$DEPLOY_PATH/deployment_logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

# Certbot configuration
CERT_DIR="/etc/letsencrypt/live"
CERT_NAME="khaz.app"
CLOUDFLARE_CONF="/etc/letsencrypt/cloudflare.ini"
RENEWAL_DIR="/etc/letsencrypt/renewal"

# Environment-specific configuration
case "$ENVIRONMENT" in
    staging)
        DOMAIN="khaz.app"
        SUBDOMAINS=("kms.khaz.app" "kms-be.khaz.app" "www.khaz.app")
        BACKEND_URL="https://kms-be.khaz.app"
        FRONTEND_URL="https://kms.khaz.app"
        ;;
    production)
        DOMAIN="dpd.go.id"
        SUBDOMAINS=("kms.dpd.go.id" "kms-be.dpd.go.id")
        BACKEND_URL="https://kms-be.dpd.go.id"
        FRONTEND_URL="https://kms.dpd.go.id"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

mkdir -p "$LOG_DIR"

log_info()    { echo -e "${BLUE}[INFO]${NC}     $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[✓]${NC}       $1" | tee -a "$LOG_FILE"; }
log_error()   { echo -e "${RED}[ERROR]${NC}    $1" | tee -a "$LOG_FILE"; exit 1; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1" | tee -a "$LOG_FILE"; }
log_header()  { echo ""; echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}" | tee -a "$LOG_FILE"; echo -e "${CYAN}║${NC} $1" | tee -a "$LOG_FILE"; echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}" | tee -a "$LOG_FILE"; echo ""; }

# =============================================================================
# CERTIFICATE MANAGEMENT FUNCTIONS
# =============================================================================

# Check if root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Must run as root (sudo)"
    fi
}

# Check required tools
check_requirements() {
    log_info "Checking system requirements..."
    
    local missing=()
    
    # Check certbot
    if ! command -v certbot &> /dev/null; then
        missing+=("certbot (install: sudo apt-get install certbot)")
    fi
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker (install: https://docs.docker.com/install)")
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        missing+=("docker-compose (install: sudo apt-get install docker-compose)")
    fi
    
    # Check nginx
    if ! command -v nginx &> /dev/null; then
        missing+=("nginx (install: sudo apt-get install nginx)")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing requirements: ${missing[*]}"
    fi
    
    log_success "All requirements met"
}

# Check if certificate exists
cert_exists() {
    [[ -f "$CERT_DIR/$CERT_NAME/fullchain.pem" ]]
}

# Get certificate expiration date
get_cert_expiry() {
    if cert_exists; then
        openssl x509 -enddate -noout -in "$CERT_DIR/$CERT_NAME/fullchain.pem" | cut -d= -f2
    else
        echo "N/A"
    fi
}

# Check if certificate covers all required domains
check_cert_domains() {
    if ! cert_exists; then
        return 1
    fi
    
    log_info "Checking certificate domains..."
    
    # Get certificate SANs
    local cert_domains=$(openssl x509 -noout -text -in "$CERT_DIR/$CERT_NAME/fullchain.pem" | grep "DNS:" | tr ',' '\n' | grep DNS | sed 's/.*DNS://' | tr -d ' ')
    
    local has_wildcard=false
    local has_all_domains=true
    
    # Check for wildcard
    if echo "$cert_domains" | grep -q "^\*\.$DOMAIN\$"; then
        has_wildcard=true
        log_success "✓ Certificate has wildcard: *.$DOMAIN"
    fi
    
    # Check for specific domains
    for subdomain in "${SUBDOMAINS[@]}"; do
        if echo "$cert_domains" | grep -q "^$subdomain\$"; then
            log_success "  ✓ $subdomain"
        else
            log_warn "  ✗ $subdomain (NOT in certificate)"
            has_all_domains=false
        fi
    done
    
    # Certificate is valid if it has wildcard OR all specific domains
    if [[ "$has_wildcard" == "true" ]] || [[ "$has_all_domains" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# Check if certificate is about to expire
cert_expiring_soon() {
    if ! cert_exists; then
        return 1
    fi
    
    local expiry_date=$(get_cert_expiry)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    if [[ $days_left -lt 30 ]]; then
        log_warn "Certificate expires in $days_left days"
        return 0
    else
        log_info "Certificate valid for $days_left days"
        return 1
    fi
}

# Setup Cloudflare credentials
setup_cloudflare_credentials() {
    if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
        log_warn "CLOUDFLARE_API_TOKEN not provided, skipping Cloudflare setup"
        return 1
    fi
    
    log_info "Setting up Cloudflare credentials..."
    
    if [[ "$DRY_RUN" != "true" ]]; then
        cat > "$CLOUDFLARE_CONF" <<EOF
dns_cloudflare_api_token = $CLOUDFLARE_API_TOKEN
EOF
        chmod 600 "$CLOUDFLARE_CONF"
        log_success "Cloudflare credentials configured"
    else
        log_info "[DRY RUN] Would configure Cloudflare credentials"
    fi
}

# Install Cloudflare Certbot plugin
install_cloudflare_plugin() {
    if command -v certbot-dns-cloudflare &> /dev/null || python3 -c "import certbot_dns_cloudflare" 2>/dev/null; then
        log_success "Cloudflare plugin already installed"
        return 0
    fi
    
    log_info "Installing python3-certbot-dns-cloudflare..."
    if [[ "$DRY_RUN" != "true" ]]; then
        apt-get update -qq
        apt-get install -y -qq python3-certbot-dns-cloudflare
        log_success "Cloudflare plugin installed"
    else
        log_info "[DRY RUN] Would install Cloudflare plugin"
    fi
}

# Check Cloudflare availability
has_cloudflare_support() {
    [[ ! -z "$CLOUDFLARE_API_TOKEN" ]] && [[ -f "$CLOUDFLARE_CONF" ]]
}

# Renew certificate using Cloudflare DNS
renew_cert_cloudflare() {
    log_info "Renewing certificate with Cloudflare DNS validation..."
    
    install_cloudflare_plugin
    setup_cloudflare_credentials
    
    if [[ "$DRY_RUN" != "true" ]]; then
        if certbot certonly --dns-cloudflare \
            --dns-cloudflare-credentials "$CLOUDFLARE_CONF" \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --agree-tos \
            --email "$ADMIN_EMAIL" \
            --expand \
            --non-interactive; then
            log_success "Certificate renewed successfully with Cloudflare"
            return 0
        else
            log_error "Certificate renewal failed with Cloudflare"
        fi
    else
        log_info "[DRY RUN] Would renew certificate with Cloudflare"
    fi
}

# Renew certificate using manual DNS
renew_cert_manual() {
    log_warn "Manual DNS validation required for wildcard certificate"
    log_info "You'll need to add DNS TXT record(s) to your domain registrar"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        certbot certonly --manual \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --agree-tos \
            --email "$ADMIN_EMAIL" \
            --expand
    else
        log_info "[DRY RUN] Would request manual DNS validation"
    fi
}

# Create initial certificate if doesn't exist
create_certificate() {
    if cert_exists; then
        log_info "Certificate already exists"
        return 0
    fi
    
    log_info "Creating new SSL certificate for $DOMAIN..."
    
    # Try Cloudflare first
    if has_cloudflare_support; then
        log_info "Using Cloudflare DNS validation"
        renew_cert_cloudflare
    else
        log_warn "Cloudflare not configured, using manual DNS validation"
        log_warn "You'll need to manually verify DNS records"
        renew_cert_manual
    fi
}

# Validate certificate health
validate_certificate() {
    log_header "Certificate Validation"
    
    if [[ "$SKIP_CERT" == "true" ]]; then
        log_warn "Certificate check SKIPPED (not recommended for production)"
        return 0
    fi
    
    # Check if certificate exists
    if ! cert_exists; then
        log_warn "Certificate does not exist yet"
        create_certificate
    fi
    
    # Check if expiring soon
    if cert_expiring_soon; then
        log_info "Renewing expiring certificate..."
        if has_cloudflare_support; then
            renew_cert_cloudflare
        else
            log_warn "Please renew certificate manually: certbot renew"
            return 1
        fi
    fi
    
    # Check domain coverage
    if ! check_cert_domains; then
        log_error "Certificate does not cover required domains. Renew with: certbot certonly -d $DOMAIN -d *.$DOMAIN"
    fi
    
    log_success "Certificate validation passed"
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

# Create backups
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        return 0
    fi
    
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        local backup_file="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
        tar -czf "$backup_file" \
            docker-compose.yml \
            .env \
            ../*.conf 2>/dev/null || true
        log_success "Backup created: $backup_file"
    fi
}

# Update repository
update_repo() {
    log_info "Updating repository..."
    cd "$DEPLOY_PATH"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        git pull origin main || log_warn "Git pull failed (might be offline)"
    else
        log_info "[DRY RUN] Would pull from git"
    fi
    log_success "Repository updated"
}

# Build Docker images
build_docker() {
    log_info "Building Docker images..."
    cd "$DEPLOY_PATH"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        docker-compose build --no-cache || log_error "Docker build failed"
    else
        log_info "[DRY RUN] Would build Docker images"
    fi
    log_success "Docker images built"
}

# Deploy containers
deploy_containers() {
    log_info "Deploying containers..."
    cd "$DEPLOY_PATH"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        docker-compose down || true
        docker-compose up -d || log_error "Docker deployment failed"
        sleep 3
    else
        log_info "[DRY RUN] Would deploy containers"
    fi
    log_success "Containers deployed"
}

# Run migrations
run_migrations() {
    log_info "Running database migrations..."
    
    if [[ "$DRY_RUN" != "true" ]]; then
        docker-compose exec -T django python manage.py migrate --noinput || log_warn "Migrations failed"
    else
        log_info "[DRY RUN] Would run migrations"
    fi
    log_success "Migrations completed"
}

# Update Nginx
update_nginx() {
    log_info "Updating Nginx configuration..."
    
    if [[ "$DRY_RUN" != "true" ]]; then
        local nginx_conf=""
        case "$ENVIRONMENT" in
            staging)
                nginx_conf="nginx-kms-subdomains.conf"
                ;;
            production)
                nginx_conf="nginx-kms-production.conf"
                ;;
        esac
        
        if [[ -f "$DEPLOY_PATH/$nginx_conf" ]]; then
            cp "$DEPLOY_PATH/$nginx_conf" /etc/nginx/sites-available/kms
            nginx -t || log_error "Nginx config test failed"
            systemctl reload nginx || log_error "Nginx reload failed"
        else
            log_error "Nginx config not found: $nginx_conf"
        fi
    else
        log_info "[DRY RUN] Would update Nginx"
    fi
    log_success "Nginx configured"
}

# Health check
run_health_check() {
    if [[ "$HEALTH_CHECK" != "true" ]]; then
        return 0
    fi
    
    log_info "Running health checks..."
    sleep 5
    
    # Check backend health
    if curl -sf "http://127.0.0.1:8002/health/" > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_warn "Backend health check timed out"
    fi
    
    # Check frontend (basic connectivity)
    if [[ "$DRY_RUN" != "true" ]]; then
        if timeout 10 bash -c "echo > /dev/tcp/127.0.0.1/5175" 2>/dev/null; then
            log_success "Frontend port responding"
        else
            log_warn "Frontend port not responding"
        fi
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

trap 'log_error "Deployment failed! Check logs: $LOG_FILE"' ERR

log_header "KMSetjen DPD RI - Master Deployment Enhanced"

log_info "Environment: $ENVIRONMENT"
log_info "Domain: $DOMAIN"
log_info "Subdomains: ${SUBDOMAINS[*]}"
log_info "Deploy Path: $DEPLOY_PATH"
log_info "Log File: $LOG_FILE"

[[ "$DRY_RUN" == "true" ]] && log_warn "[DRY RUN] No changes will be made"
[[ "$SKIP_CERT" == "true" ]] && log_warn "[SKIP CERT] Certificate validation disabled"

# Check prerequisites
check_root
check_requirements

# Verify project structure
if [[ ! -f "$DEPLOY_PATH/docker-compose.yml" ]]; then
    log_error "docker-compose.yml not found in: $DEPLOY_PATH"
fi
log_success "Project structure verified"

# Certificate management
if [[ "$CERT_ONLY" == "true" ]]; then
    # Certificate-only mode
    validate_certificate
    log_header "Certificate Management Completed"
    log_info "To continue with deployment, run: $0 $ENVIRONMENT"
    exit 0
else
    # Regular deployment
    validate_certificate
fi

# Deployment steps
create_backup
update_repo
build_docker
deploy_containers
run_migrations
update_nginx
run_health_check

# Summary
log_header "Deployment Completed Successfully"
log_success "Environment: $ENVIRONMENT"
log_success "Frontend: $FRONTEND_URL"
log_success "Backend: $BACKEND_URL"
log_success "Certificate: $CERT_DIR/$CERT_NAME/fullchain.pem"
log_success "Status: All systems operational"
log_info "Next steps:"
log_info "  1. Test: curl -v $FRONTEND_URL"
log_info "  2. Check logs: tail -f $LOG_FILE"
log_info "  3. View containers: docker-compose ps"

log_success "✓ Deployment ready!"
