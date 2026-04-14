#!/bin/bash

################################################################################
# KMS Production Deployment Script (Linux/macOS Bash)
################################################################################
# This script deploys KMS Setjen DPD RI to staging or production environments
#
# USAGE:
#   ./deploy.sh staging                    # Deploy to staging
#   ./deploy.sh production --skip-tests    # Deploy production
#   ./deploy.sh development --build-only   # Build only
#
# REQUIREMENTS:
#   - Docker & Docker Compose
#   - Git 2.30+
#   - PostgreSQL 15+ (local or remote)
#   - Bash 4.0+
#   - curl, grep, sed, awk
################################################################################

set -e  # Exit on error

# ==============================================================================
# COLOR CODES & CONFIGURATION
# ==============================================================================

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'  # No Color

# Configuration
readonly ENVIRONMENT="${1:-staging}"
readonly PROJECT_DIR="$(pwd)"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly LOG_DIR="${PROJECT_DIR}/deployment_logs"
readonly LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
readonly BACKUP_DIR="${PROJECT_DIR}/backups"

# Flags
SKIP_BACKUP=false
SKIP_TESTS=false
NO_PULL=false
BUILD_ONLY=false
NO_HEALTH_CHECK=false

# Parse arguments
while [[ $# -gt 1 ]]; do
    case "$2" in
        --skip-backup)      SKIP_BACKUP=true ;;
        --skip-tests)       SKIP_TESTS=true ;;
        --no-pull)          NO_PULL=true ;;
        --build-only)       BUILD_ONLY=true ;;
        --no-health-check)  NO_HEALTH_CHECK=true ;;
        *)                  echo "Unknown option: $2"; exit 1 ;;
    esac
    shift
done

# Create logs directory
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================

log_info() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_success() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_error() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_warning() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

# ==============================================================================
# BANNER
# ==============================================================================

echo ""
echo -e "${CYAN}========================================"
echo "KMS SETJEN DPD RI - DOCKER DEPLOYMENT"
echo "========================================${NC}"
echo -e "${CYAN}Environment: ${ENVIRONMENT}${NC}"
[[ "$BUILD_ONLY" == "true" ]] && echo -e "${YELLOW}Mode: BUILD ONLY${NC}"
echo -e "${CYAN}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

log_info "Starting $ENVIRONMENT deployment"
log_info "Project directory: $PROJECT_DIR"
log_info "Log file: $LOG_FILE"

# ==============================================================================
# VALIDATION
# ==============================================================================

validate_environment() {
    log_info "Validating deployment environment..."
    
    # Check for valid environment
    case "$ENVIRONMENT" in
        development|staging|production) ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Valid: development, staging, production"
            exit 1
            ;;
    esac
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    local docker_version
    docker_version=$(docker --version 2>/dev/null)
    log_success "Docker found: $docker_version"
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose not found"
        exit 1
    fi
    
    local compose_version
    compose_version=$(docker-compose --version 2>/dev/null)
    log_success "docker-compose found: $compose_version"
    
    # Check .env file
    if [[ ! -f ".env" ]]; then
        log_error ".env file not found. Create from .env.example"
        exit 1
    fi
    log_success ".env file found"
    
    # Check docker-compose.yml
    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found"
        exit 1
    fi
    log_success "docker-compose.yml found"
    
    # Check PostgreSQL
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            log_success "PostgreSQL is accessible on localhost:5432"
        fi
    else
        log_warning "PostgreSQL check skipped (pg_isready not found)"
    fi
    
    log_success "Environment validation completed"
}

# ==============================================================================
# ENVIRONMENT CONFIG
# ==============================================================================

configure_environment() {
    log_info "Configuring for: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        development)
            log_info "Development mode configured"
            ;;
        staging)
            log_info "Staging mode configured"
            log_warning "Verify: ALLOWED_HOSTS, database credentials, and secrets in .env"
            ;;
        production)
            log_warning "PRODUCTION DEPLOYMENT - Verifying security checks..."
            
            # Check DEBUG setting
            if grep -q "DEBUG\s*=\s*True" .env; then
                log_error "ERROR: DEBUG=True in production"
                exit 1
            fi
            
            # Check ENVIRONMENT setting
            if grep -q "ENVIRONMENT\s*=\s*development" .env; then
                log_error "ERROR: ENVIRONMENT=development in production"
                exit 1
            fi
            
            # Require explicit confirmation
            echo -n "Confirm production deployment (yes/no): "
            read -r response
            if [[ "$response" != "yes" ]]; then
                log_error "Deployment cancelled"
                exit 1
            fi
            ;;
    esac
}

# ==============================================================================
# BACKUP
# ==============================================================================

backup_database() {
    if [[ "$ENVIRONMENT" != "production" ]] || [[ "$SKIP_BACKUP" == "true" ]]; then
        return
    fi
    
    log_warning "Production: Creating database backup..."
    mkdir -p "$BACKUP_DIR"
    local backup_file="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
    
    log_info "Backing up database..."
    if docker-compose ps | grep -q "kms_django"; then
        if docker-compose exec -T django python manage.py dumpdata --all > "$backup_file"; then
            log_success "Database backup created: $backup_file"
        else
            log_warning "Backup creation skipped"
        fi
    fi
}

# ==============================================================================
# GIT PULL
# ==============================================================================

update_code() {
    if [[ "$NO_PULL" == "true" ]]; then
        log_info "Skipping code update"
        return
    fi
    
    log_info "Updating code from repository..."
    if git pull origin main 2>/dev/null; then
        log_success "Code updated"
    else
        log_warning "Git pull skipped"
    fi
}

# ==============================================================================
# DOCKER BUILD & STARTUP
# ==============================================================================

build_images() {
    log_info "Building Docker images..."
    if ! docker-compose build 2>&1; then
        log_error "Docker build failed"
        exit 1
    fi
    log_success "Docker images built"
}

start_services() {
    log_info "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    log_info "Starting containers..."
    if ! docker-compose up -d 2>&1; then
        log_error "Failed to start containers"
        exit 1
    fi
    log_success "Containers started"
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

check_services() {
    log_info "Checking services..."
    sleep 10
    
    # PostgreSQL (local)
    log_info "Checking PostgreSQL..."
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            log_success "PostgreSQL ready"
        fi
    fi
    
    # Redis
    log_info "Checking Redis..."
    local redis_ok=false
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            log_success "Redis ready"
            redis_ok=true
            break
        fi
        sleep 1
    done
    
    # Django
    log_info "Checking Django..."
    local django_ok=false
    for i in {1..30}; do
        if docker-compose exec -T django python manage.py check 2>/dev/null; then
            log_success "Django ready"
            django_ok=true
            break
        fi
        sleep 2
    done
    
    if [[ "$django_ok" != "true" ]] && [[ "$NO_HEALTH_CHECK" != "true" ]]; then
        log_error "Django failed to start"
        exit 1
    fi
}

# ==============================================================================
# DATABASE SETUP
# ==============================================================================

setup_database() {
    log_info "Running migrations..."
    
    # Check if migrations are needed first
    log_info "Checking pending migrations..."
    if ! docker-compose exec -T django python manage.py migrate --check 2>&1; then
        log_info "Pending migrations detected, running migrations now..."
    else
        log_success "No pending migrations found"
    fi
    
    # Run migrations with full output
    log_info "Executing migrations..."
    if ! docker-compose exec -T django python manage.py migrate --noinput; then
        log_error "Migration failed! See detailed output above."
        log_error "Check database connection, permissions, and migration files."
        exit 1
    fi
    
    # Verify migrations ran successfully
    log_info "Verifying migrations..."
    if ! docker-compose exec -T django python manage.py migrate --check; then
        log_error "Migrations verification failed! Some migrations may have failed."
        exit 1
    fi
    
    log_success "Migrations completed and verified"
    
    log_info "Collecting static files..."
    if ! docker-compose exec -T django python manage.py collectstatic --noinput; then
        log_warning "Static files collection had issues but continuing deployment"
    else
        log_success "Static files collected"
    fi
    
    # Verify database is accessible and models are loaded
    log_info "Verifying database connection..."
    if docker-compose exec -T django python manage.py check; then
        log_success "Database and application check passed"
    else
        log_error "Database connection or application check failed"
        log_error "Migrations may have succeeded, but application verification failed"
    fi
}

# ==============================================================================
# VERIFICATION
# ==============================================================================

verify_services() {
    log_info "Verifying services..."
    
    if curl -s http://localhost:8002/api/ > /dev/null; then
        log_success "Django API responding"
    else
        log_warning "Django API not responsive yet"
    fi
    
    if curl -s http://localhost:5175/ > /dev/null; then
        log_success "Frontend responding"
    else
        log_warning "Frontend not responsive yet"
    fi
}

# ==============================================================================
# ERROR HANDLING
# ==============================================================================

trap 'handle_error' ERR

handle_error() {
    log_error "Deployment failed"
    exit 1
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

main() {
    log_info "Pre-deployment validation..."
    validate_environment
    
    log_info "Configuring environment..."
    configure_environment
    
    log_info "Preparing backup..."
    backup_database
    
    log_info "Updating code..."
    update_code
    
    log_info "Building Docker images..."
    build_images
    
    if [[ "$BUILD_ONLY" == "true" ]]; then
        log_success "Build complete. Run: docker-compose up -d"
        exit 0
    fi
    
    log_info "Starting services..."
    start_services
    
    log_info "Checking service health..."
    check_services
    
    log_info "Setting up database..."
    setup_database
    
    log_info "Verifying deployment..."
    verify_services
    
    # ==============================================================================
    # SUCCESS
    # ==============================================================================
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    log_success "Deployment to [$ENVIRONMENT] completed!"
    log_info "Logs: $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Services:${NC}"
    echo -e "${CYAN}  Django API ........... http://localhost:8002${NC}"
    echo -e "${CYAN}  Frontend ............ http://localhost:5175${NC}"
    echo -e "${CYAN}  PostgreSQL .......... localhost:5432 (local)${NC}"
    echo -e "${CYAN}  Redis ............... Docker container${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "${CYAN}  docker-compose logs -f${NC}"
    echo -e "${CYAN}  docker-compose ps${NC}"
    echo ""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "${YELLOW}PRODUCTION CHECKLIST:${NC}"
        echo -e "${CYAN}  - Monitor logs for 24 hours${NC}"
        echo -e "${CYAN}  - Verify critical workflows${NC}"
        echo -e "${CYAN}  - Test backup restoration${NC}"
        echo -e "${CYAN}  - Verify SSL/HTTPS${NC}"
        echo ""
    fi
}

# Run main function
main
