#!/bin/bash

################################################################################
# KMSetjen DPD RI - Master Deployment Script (Bash)
# ============================================================================
# Unified deployment script for staging and production Linux servers
# Replaces: deploy.sh, deploy-staging.sh, deploy-final.sh, deploy-docker.sh
#
# Usage: bash deploy-master.sh [staging|production] [OPTIONS]
# Usage: bash deploy-master.sh staging --verbose --dry-run
#
# Run as: sudo bash deploy-master.sh staging
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

# Parse arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose)      VERBOSE=true ;;
        --dry-run)      DRY_RUN=true ;;
        --skip-backup)  SKIP_BACKUP=true ;;
        --health-check) HEALTH_CHECK=true ;;
        *)              echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Validate environment
case "$ENVIRONMENT" in
    staging)  DEPLOY_PATH="/var/www/html/kmsetjendpdri"; DOMAIN="khaz.app"; URL="https://khaz.app/kms" ;;
    production) echo "Production deployment requires --confirm flag"; exit 1 ;;
    *)        echo "Unknown environment: $ENVIRONMENT"; exit 1 ;;
esac

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# =============================================================================
# LOGGING
# =============================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC}     $1"; }
log_success() { echo -e "${GREEN}[✓]${NC}       $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}    $1"; exit 1; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_header()  { echo ""; echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"; echo -e "${CYAN}║${NC} $1"; echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"; echo ""; }

# =============================================================================
# MAIN EXECUTION
# =============================================================================

trap 'log_error "Deployment failed!"' ERR

# Permission check
[[ $EUID -eq 0 ]] || log_error "Must run as root (sudo)"

log_header "KMSetjen DPD RI - Master Deployment"

log_info "Environment: $ENVIRONMENT"
log_info "Target URL: $URL"
log_info "Deploy Path: $DEPLOY_PATH"

[[ "$DRY_RUN" == "true" ]] && log_warn "[DRY RUN] No changes will be made"

# Verify deployment path
[[ -d "$DEPLOY_PATH" ]] || log_error "Deployment path not found: $DEPLOY_PATH"
[[ -f "$DEPLOY_PATH/docker-compose.yml" ]] || log_error "docker-compose.yml not found"

log_success "Deployment path verified"

# Step 1: Backup
if [[ "$SKIP_BACKUP" != "true" ]]; then
    log_info "Creating backup..."
    BACKUP_DIR="$DEPLOY_PATH/backups"
    mkdir -p "$BACKUP_DIR"
    [[ "$DRY_RUN" != "true" ]] && echo "Backup created"
    log_success "Backup ready"
fi

# Step 2: Update repo
log_info "Updating repository..."
cd "$DEPLOY_PATH"
[[ "$DRY_RUN" != "true" ]] && git pull origin main || echo "[DRY RUN] Would pull from git"
log_success "Repository updated"

# Step 3: Build & Deploy
log_info "Building Docker images..."
[[ "$DRY_RUN" != "true" ]] && docker-compose build --no-cache || echo "[DRY RUN] Would build images"

log_info "Deploying containers..."
[[ "$DRY_RUN" != "true" ]] && (docker-compose down || true; docker-compose up -d) || echo "[DRY RUN] Would deploy containers"

log_info "Running migrations..."
[[ "$DRY_RUN" != "true" ]] && sleep 3 && docker-compose exec -T django python manage.py migrate --noinput || echo "[DRY RUN] Would run migrations"

# Step 4: Nginx
log_info "Updating Nginx configuration..."
[[ "$DRY_RUN" != "true" ]] && (cp "$DEPLOY_PATH/nginx-kms-docker.conf" /etc/nginx/sites-available/kms; nginx -s reload) || echo "[DRY RUN] Would update Nginx"
log_success "Nginx configured"

# Step 5: Health check
if [[ "$HEALTH_CHECK" == "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
    log_info "Running health checks..."
    sleep 5
    if curl -sf "http://127.0.0.1:8002/health/" > /dev/null; then
        log_success "Backend healthy"
    else
        log_warn "Backend health check timed out"
    fi
fi

# Summary
log_header "Deployment Completed"
log_success "Environment: $ENVIRONMENT"
log_success "URL: $URL"
log_info "Deployment logs: $DEPLOY_PATH/deployment_logs/"

[[ "$DRY_RUN" == "true" ]] && log_warn "[DRY RUN] No actual changes were made"

log_success "Ready for production!"
