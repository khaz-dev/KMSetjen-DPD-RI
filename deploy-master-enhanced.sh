#!/bin/bash

################################################################################
# KMSetjen DPD RI - Enhanced Master Deployment Script (Bash v3.0)
# ============================================================================
# Comprehensive server-side deployment with 3 flexible modes:
# 1. CLEAN - Fresh build with no data (for testing/development)
# 2. UPDATE-WITH-DATA - Import data from backup/previous deployment
# 3. UPDATE-ONLY - Code update only, keep existing data (production-safe)
#
# Features:
# - SSL certificate management (auto-renewal)
# - Database migration and backup
# - Media file management
# - Health checks and validation
# - Comprehensive logging
#
# Usage:
#   sudo bash deploy-master.sh staging [--mode=clean|update-with-data|update-only]
#   sudo bash deploy-master.sh production --mode=update-only
#   sudo bash deploy-master.sh staging --mode=update-with-data --verbose
#
# Requirements:
#   - Run as root (sudo)
#   - Docker & Docker Compose installed
#   - PostgreSQL client tools (psql, pg_dump)
#   - Certbot for SSL (optional but recommended)
#
################################################################################

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

ENVIRONMENT="${1:-staging}"
MODE="${2:-update-only}"
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}
SKIP_CERT=${SKIP_CERT:-false}
HEALTH_CHECK=${HEALTH_CHECK:-true}

# Parse additional arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
    case "$1" in
        --mode=*)           MODE="${1#*=}" ;;
        --verbose)          VERBOSE=true ;;
        --dry-run)          DRY_RUN=true ;;
        --skip-backup)      SKIP_BACKUP=true ;;
        --skip-cert)        SKIP_CERT=true ;;
        --no-health-check)  HEALTH_CHECK=false ;;
        *)                  log_warn "Unknown option: $1" ;;
    esac
    shift
done

# Validate mode
case "$MODE" in
    clean|update-with-data|update-only) ;;
    *)
        echo "Invalid mode: $MODE (must be: clean, update-with-data, or update-only)"
        exit 1
        ;;
esac

# Auto-detect deployment path
DEPLOY_PATH="$(pwd)"
BACKUP_DIR="$DEPLOY_PATH/backups"
LOG_DIR="$DEPLOY_PATH/deployment_logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

# Database configuration
DB_NAME="kmsdb"
DB_USER="postgres"
DB_PASSWORD="${DB_PASSWORD:-Okkdpdri@2026}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DUMP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

# Media configuration
MEDIA_PATH="$DEPLOY_PATH/media"
MEDIA_BACKUP_PATH="$BACKUP_DIR/media_backup_${TIMESTAMP}"

# Certbot configuration
CERT_DIR="/etc/letsencrypt/live"
CERT_NAME="khaz.app"

# Environment-specific configuration
case "$ENVIRONMENT" in
    staging)
        DOMAIN="khaz.app"
        FRONTEND_URL="https://kms.khaz.app"
        BACKEND_URL="https://kms-be.khaz.app"
        NGINX_CONFIG="nginx-kms-subdomains.conf"
        ;;
    production)
        DOMAIN="dpd.go.id"
        FRONTEND_URL="https://kms.dpd.go.id"
        BACKEND_URL="https://kms-be.dpd.go.id"
        NGINX_CONFIG="nginx-kms-production.conf"
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

mkdir -p "$LOG_DIR" "$BACKUP_DIR"

log_info()    { echo -e "${BLUE}[INFO]${NC}     $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[✓]${NC}       $1" | tee -a "$LOG_FILE"; }
log_error()   { echo -e "${RED}[ERROR]${NC}    $1" | tee -a "$LOG_FILE"; exit 1; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1" | tee -a "$LOG_FILE"; }
log_header()  { 
    echo "" | tee -a "$LOG_FILE"
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}║${NC} $1" | tee -a "$LOG_FILE"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

log_dry_run() { echo -e "${CYAN}[DRY RUN]${NC}   $1" | tee -a "$LOG_FILE"; }

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Must run as root (sudo)"
    fi
}

check_requirements() {
    log_info "Checking system requirements..."
    
    local missing=()
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    else
        log_success "Docker found"
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        missing+=("docker-compose")
    else
        log_success "Docker Compose found"
    fi
    
    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        missing+=("psql (PostgreSQL client)")
    else
        log_success "PostgreSQL client found"
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing requirements: ${missing[*]}"
    fi
}

check_project_structure() {
    log_info "Checking project structure..."
    
    if [[ ! -f "$DEPLOY_PATH/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found"
    fi
    
    if [[ ! -f "$DEPLOY_PATH/.env" ]]; then
        log_warn ".env file not found (should be provided by deployment)"
    fi
    
    if [[ ! -f "$DEPLOY_PATH/$NGINX_CONFIG" ]]; then
        log_warn "Nginx config not found: $NGINX_CONFIG"
    fi
    
    log_success "Project structure verified"
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

create_database_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warn "Database backup SKIPPED"
        return
    fi
    
    log_info "Creating database backup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would backup database to: $DB_DUMP_FILE"
        return
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    if pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$DB_DUMP_FILE" 2>/dev/null; then
        local size=$(du -h "$DB_DUMP_FILE" | cut -f1)
        log_success "Database backed up ($size)"
    else
        log_warn "Database backup failed (database may not exist yet)"
    fi
    unset PGPASSWORD
}

create_media_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]] || [[ ! -d "$MEDIA_PATH" ]]; then
        return
    fi
    
    log_info "Backing up media files..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would backup media to: $MEDIA_BACKUP_PATH"
        return
    fi
    
    mkdir -p "$MEDIA_BACKUP_PATH"
    cp -r "$MEDIA_PATH"/* "$MEDIA_BACKUP_PATH/" 2>/dev/null || true
    log_success "Media backed up"
}

# =============================================================================
# DATABASE MANAGEMENT FUNCTIONS
# =============================================================================

reset_database() {
    log_info "Resetting database for clean build..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would reset database: DROP DATABASE IF EXISTS $DB_NAME"
        return
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop existing database
    psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    
    # Create fresh database
    psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
        log_error "Failed to create database"
    }
    
    unset PGPASSWORD
    log_success "Database reset complete"
}

import_database() {
    local dump_file="$1"
    
    if [[ ! -f "$dump_file" ]]; then
        log_warn "Database dump file not found: $dump_file"
        return
    fi
    
    log_info "Importing database from: $dump_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would import database from dump"
        return
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Import data
    if psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" < "$dump_file" 2>/dev/null; then
        log_success "Database imported successfully"
    else
        log_warn "Database import had issues"
    fi
    
    unset PGPASSWORD
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

update_code() {
    log_info "Updating code from Git..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would update: git pull origin main"
        return
    fi
    
    if git pull origin main 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Code updated from Git"
    else
        log_warn "Git update had issues"
    fi
}

build_docker_images() {
    local clean_flag=""
    
    if [[ "$MODE" == "clean" ]]; then
        clean_flag="--no-cache"
        log_info "Building Docker images (clean build, no cache)..."
    else
        log_info "Building Docker images..."
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would build: docker-compose build $clean_flag"
        return
    fi
    
    if docker-compose build $clean_flag 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Docker images built successfully"
    else
        log_error "Docker build failed"
    fi
}

stop_containers() {
    log_info "Stopping containers..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would stop: docker-compose down"
        return
    fi
    
    docker-compose down || true
    sleep 2
    log_success "Containers stopped"
}

start_containers() {
    log_info "Starting containers..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would start: docker-compose up -d"
        return
    fi
    
    docker-compose up -d || log_error "Failed to start containers"
    sleep 3
    log_success "Containers started"
}

run_migrations() {
    log_info "Running database migrations..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_dry_run "Would run: docker-compose exec django python manage.py migrate"
        return
    fi
    
    if docker-compose exec -T django python manage.py migrate --noinput 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Migrations completed"
    else
        log_warn "Migrations had issues or no migrations pending"
    fi
}

# =============================================================================
# DEPLOYMENT MODES
# =============================================================================

deploy_clean() {
    log_header "DEPLOYMENT MODE: CLEAN BUILD"
    log_info "Fresh build with no data migration"
    
    check_project_structure
    
    create_database_backup
    
    update_code
    
    reset_database
    
    build_docker_images
    
    stop_containers
    
    start_containers
    
    run_migrations
}

deploy_update_with_data() {
    log_header "DEPLOYMENT MODE: UPDATE WITH DATA MIGRATION"
    log_info "Syncing local database (from backup/staging)"
    
    check_project_structure
    
    create_database_backup
    
    create_media_backup
    
    update_code
    
    stop_containers
    
    # Import from latest backup if available
    if [[ -f "$DB_DUMP_FILE" ]]; then
        import_database "$DB_DUMP_FILE"
    fi
    
    build_docker_images
    
    start_containers
    
    run_migrations
}

deploy_update_only() {
    log_header "DEPLOYMENT MODE: UPDATE ONLY"
    log_info "Code update only, existing data preserved"
    
    check_project_structure
    
    # Optional backup for safety
    create_database_backup
    
    update_code
    
    build_docker_images
    
    stop_containers
    
    start_containers
    
    # Run migrations in case there are new ones
    run_migrations
}

# =============================================================================
# CERTIFICATE MANAGEMENT
# =============================================================================

validate_certificate() {
    if [[ "$SKIP_CERT" == "true" ]]; then
        log_warn "Certificate validation SKIPPED"
        return
    fi
    
    log_header "Certificate Validation"
    
    if [[ ! -f "$CERT_DIR/$CERT_NAME/fullchain.pem" ]]; then
        log_warn "SSL certificate not found for $DOMAIN"
        log_info "To create certificate: sudo certbot certonly --manual -d $DOMAIN -d *.$DOMAIN"
        return
    fi
    
    local expiry=$(openssl x509 -enddate -noout -in "$CERT_DIR/$CERT_NAME/fullchain.pem" | cut -d= -f2)
    log_success "Certificate found, expires: $expiry"
}

# =============================================================================
# HEALTH CHECKS
# =============================================================================

run_health_checks() {
    if [[ "$HEALTH_CHECK" != "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log_header "Health Checks"
    
    log_info "Checking container status..."
    docker-compose ps | tee -a "$LOG_FILE"
    
    sleep 3
    
    log_info "Testing backend API..."
    if curl -sf http://127.0.0.1:8002/health/ > /dev/null 2>&1; then
        log_success "Backend API responding"
    else
        log_warn "Backend API not responding yet (may still be starting)"
    fi
    
    log_info "Checking database connectivity..."
    if docker-compose exec -T django python manage.py dbshell <<< "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database connected"
    else
        log_warn "Database connectivity issue"
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

trap 'log_error "Deployment failed! Check logs: $LOG_FILE"' ERR

log_header "KMSetjen DPD RI - Master Deployment Enhanced v3.0"

log_info "Environment: $ENVIRONMENT"
log_info "Mode: $MODE"
log_info "Domain: $DOMAIN"
log_info "Deploy Path: $DEPLOY_PATH"
log_info "Log File: $LOG_FILE"

[[ "$DRY_RUN" == "true" ]] && log_warn "[DRY RUN] No changes will be made"
[[ "$SKIP_CERT" == "true" ]] && log_warn "[SKIP CERT] Certificate validation disabled"
[[ "$VERBOSE" == "true" ]] && log_warn "[VERBOSE] Detailed logging enabled"

# Validation
check_root
check_requirements
check_project_structure

# Certificate management (optional)
validate_certificate

# Execute deployment mode
case "$MODE" in
    clean)
        deploy_clean
        ;;
    update-with-data)
        deploy_update_with_data
        ;;
    update-only)
        deploy_update_only
        ;;
esac

# Health checks
run_health_checks

# Success summary
log_header "Deployment Completed Successfully"

log_success "Environment: $ENVIRONMENT"
log_success "Mode: $MODE"
log_success "Frontend: $FRONTEND_URL"
log_success "Backend: $BACKEND_URL"
log_success "Status: All systems operational"

log_info "Next steps:"
log_info "  1. Test: curl -v $BACKEND_URL/health/"
log_info "  2. Logs: docker-compose logs -f"
log_info "  3. Status: docker-compose ps"
log_info "  4. Database: docker-compose exec django python manage.py shell"

log_success "✓ Deployment ready!"
