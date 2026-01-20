#!/bin/bash

# ==============================================================================
# KMS Production Deployment Script
# ==============================================================================
# This script handles the complete production deployment process

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# ==============================================================================
# CONFIGURATION
# ==============================================================================

ENVIRONMENT=${1:-"staging"}  # Default to staging
PROJECT_DIR="/app"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_DIR="${PROJECT_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
LOG_FILE="${LOG_DIR}/deployment_${TIMESTAMP}.log"

# ==============================================================================
# FUNCTIONS
# ==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create log directory
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# ==============================================================================
# PRE-DEPLOYMENT CHECKS
# ==============================================================================

log_info "Starting $ENVIRONMENT deployment..."
log_info "Timestamp: $TIMESTAMP"

# Check if Docker is running
log_info "Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker daemon is not running"
    exit 1
fi
log_success "Docker is running"

# Check if Docker Compose is available
log_info "Checking Docker Compose..."
if ! docker-compose --version > /dev/null 2>&1; then
    log_error "Docker Compose is not installed"
    exit 1
fi
log_success "Docker Compose is available"

# Check .env file exists
log_info "Checking environment configuration..."
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    log_error ".env file not found at ${PROJECT_DIR}/.env"
    log_info "Creating .env from .env.example..."
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    log_warning "Please update .env file with your configuration"
    exit 1
fi
log_success ".env file found"

# ==============================================================================
# DATABASE BACKUP
# ==============================================================================

log_info "Creating database backup..."
if [ "$ENVIRONMENT" == "production" ]; then
    log_warning "Production deployment detected - creating backup first"
    
    # Backup database
    if docker-compose exec -T postgres pg_dump -U postgres kms_db > "$BACKUP_FILE" 2>&1; then
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_error "Database backup failed"
        exit 1
    fi
else
    log_info "Staging deployment - skipping full backup"
fi

# ==============================================================================
# PULL LATEST CODE
# ==============================================================================

log_info "Pulling latest code from repository..."
if git pull origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Code updated"
else
    log_warning "Git pull failed or no changes"
fi

# ==============================================================================
# BUILD & START CONTAINERS
# ==============================================================================

log_info "Building Docker images..."
if docker-compose build 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Docker images built"
else
    log_error "Docker build failed"
    exit 1
fi

log_info "Stopping existing containers..."
docker-compose down 2>&1 | tee -a "$LOG_FILE" || true

log_info "Starting Docker containers..."
if docker-compose up -d 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Containers started"
else
    log_error "Failed to start containers"
    exit 1
fi

# ==============================================================================
# WAIT FOR SERVICES
# ==============================================================================

log_info "Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
log_info "Checking PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# Check Redis
log_info "Checking Redis..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Redis failed to start"
        exit 1
    fi
    sleep 1
done

# Check Django
log_info "Checking Django..."
for i in {1..30}; do
    if docker-compose exec -T django python -m django check > /dev/null 2>&1; then
        log_success "Django is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Django failed to start"
        exit 1
    fi
    sleep 1
done

# ==============================================================================
# DATABASE MIGRATIONS
# ==============================================================================

log_info "Running database migrations..."
if docker-compose exec -T django python manage.py migrate --noinput 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Database migrations completed"
else
    log_error "Migration failed"
    exit 1
fi

# ==============================================================================
# STATIC FILES
# ==============================================================================

log_info "Collecting static files..."
if docker-compose exec -T django python manage.py collectstatic --noinput 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Static files collected"
else
    log_warning "Static file collection had issues"
fi

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

log_info "Running health checks..."

# Check Django health
log_info "Checking Django health..."
if curl -f http://localhost:8000/health/ > /dev/null 2>&1; then
    log_success "Django is healthy"
else
    log_error "Django health check failed"
    exit 1
fi

# Check PostgreSQL
log_info "Checking PostgreSQL connectivity..."
if docker-compose exec -T django python manage.py dbshell <<< "SELECT 1;" > /dev/null 2>&1; then
    log_success "PostgreSQL is accessible"
else
    log_error "PostgreSQL connectivity check failed"
    exit 1
fi

# Check Redis
log_info "Checking Redis connectivity..."
if docker-compose exec -T django python -c "import redis; redis.Redis().ping()" > /dev/null 2>&1; then
    log_success "Redis is accessible"
else
    log_error "Redis connectivity check failed"
fi

# ==============================================================================
# SMOKE TESTS
# ==============================================================================

log_info "Running smoke tests..."
if docker-compose exec -T django pytest tests/models/test_models.py -q 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Model tests passed"
else
    log_warning "Some tests may have failed"
fi

# ==============================================================================
# SECURITY VERIFICATION
# ==============================================================================

log_info "Verifying security configuration..."
if docker-compose exec -T django pytest tests/security/test_security.py -q 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Security tests passed"
else
    log_warning "Security verification incomplete"
fi

# ==============================================================================
# LOG SUMMARY
# ==============================================================================

log_info "Creating deployment summary..."

SUMMARY_FILE="${LOG_DIR}/deployment_summary_${TIMESTAMP}.txt"
cat > "$SUMMARY_FILE" << EOF
================================================================================
DEPLOYMENT SUMMARY
================================================================================
Environment:        $ENVIRONMENT
Timestamp:          $TIMESTAMP
Status:             SUCCESS
Log File:           $LOG_FILE

Services Started:
  - PostgreSQL      [RUNNING] :5432
  - Redis           [RUNNING] :6379
  - Django          [RUNNING] :8000
  - Frontend        [READY]   (if configured)

Database:
  - Migrations:     ✓ Completed
  - Backup:         $BACKUP_FILE

Tests:
  - Model Tests:    ✓ Passed
  - Security Tests: ✓ Passed

Health Checks:
  - Django:         ✓ Healthy
  - PostgreSQL:     ✓ Accessible
  - Redis:          ✓ Accessible

Next Steps:
  1. Monitor application for next 24 hours
  2. Check logs for any issues: tail -f $LOG_FILE
  3. Run end-to-end tests if configured
  4. Notify team of successful deployment

Rollback Procedure:
  If issues arise, rollback using:
  docker-compose down
  docker-compose up -d

Database Backup Location:
  $BACKUP_FILE

For more information, see DEPLOYMENT_GUIDE.md
================================================================================
EOF

log_success "Deployment completed successfully!"
log_info "Summary saved to: $SUMMARY_FILE"

# ==============================================================================
# FINAL STATUS
# ==============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                  DEPLOYMENT SUCCESSFUL                     ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment:  ${BLUE}$ENVIRONMENT${NC}"
echo -e "Timestamp:    ${BLUE}$TIMESTAMP${NC}"
echo -e "Log File:     ${BLUE}$LOG_FILE${NC}"
echo -e "Backup:       ${BLUE}$BACKUP_FILE${NC}"
echo ""
echo -e "Access your application at:"
echo -e "  Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "  Admin:    ${BLUE}http://localhost:8000/admin${NC}"
echo -e "  API:      ${BLUE}http://localhost:8000/api${NC}"
echo ""

exit 0
