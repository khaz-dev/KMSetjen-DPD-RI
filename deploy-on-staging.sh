#!/usr/bin/env bash

################################################################################
#
#  KMSetjen DPD RI - Deploy on Staging Server
#  Bash Deployment Script for Linux/Ubuntu Servers
#
#  This script runs ON the staging server and deploys/updates
#  KMSetjen DPD RI on that same server.
#
#  USAGE:
#    chmod +x deploy-on-staging.sh
#    ./deploy-on-staging.sh --mode full-clean-build [--verbose]
#    ./deploy-on-staging.sh --mode update-only [--verbose]
#    ./deploy-on-staging.sh --mode update-with-data-refresh [--verbose]
#
#  MODES:
#    full-clean-build         Full rebuild, remove containers/volumes (fresh start)
#    update-only              Pull latest code, rebuild, keep data (normal update)
#    update-with-data-refresh Update code, run migrations/static refresh
#
################################################################################

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE=""
VERBOSE="${VERBOSE:-false}"

PROJECT_PATH="${SCRIPT_DIR}"
DOCKER_COMPOSE_FILE="${PROJECT_PATH}/docker-compose.yml"
ENV_FILE="${PROJECT_PATH}/.env"
BACKUP_DIR="${PROJECT_PATH}/backups"

BACKEND_SERVICE="django"
BACKEND_CONTAINER="kms_django"
FRONTEND_CONTAINER="kms_frontend"

BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="${BACKUP_DIR}/kmsdb_backup_${BACKUP_TIMESTAMP}.sql"
APP_BACKUP_DIR="${BACKUP_DIR}/app_backup_${BACKUP_TIMESTAMP}"
COMPOSE_BIN=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Logging helpers
# -----------------------------------------------------------------------------

print_header() {
	echo ""
	echo -e "${CYAN}==============================================================${NC}"
	echo -e "${CYAN}  $1${NC}"
	echo -e "${CYAN}==============================================================${NC}"
	echo ""
}

print_success() { echo -e "${GREEN}[OK] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_info() { echo -e "${BLUE}[INFO] $1${NC}"; }
print_step() { echo -e "${CYAN}-> $1${NC}"; }

print_verbose() {
	if [ "$VERBOSE" = "true" ]; then
		echo -e "${BLUE}   $1${NC}"
	fi
}

show_help() {
	cat <<EOF

KMSetjen DPD RI - Staging Server Deployment Script

USAGE:
  ./deploy-on-staging.sh --mode <mode> [OPTIONS]

MODES:
  full-clean-build          Full rebuild (removes containers/volumes)
  update-only               Update code and rebuild (keep data)
  update-with-data-refresh  Update code and run migrations/static refresh

OPTIONS:
  --mode <mode>             Deployment mode (required)
  --verbose                 Show detailed output
  --help                    Show this help message

EXAMPLES:
  ./deploy-on-staging.sh --mode update-only
  ./deploy-on-staging.sh --mode full-clean-build
  ./deploy-on-staging.sh --mode update-with-data-refresh --verbose

PROJECT PATH:
  ${PROJECT_PATH}

BACKUPS LOCATION:
  ${BACKUP_DIR}

EOF
}

# -----------------------------------------------------------------------------
# Compose/runtime helpers
# -----------------------------------------------------------------------------

run_compose() {
	if [ "$COMPOSE_BIN" = "docker compose" ]; then
		docker compose "$@"
	else
		docker-compose "$@"
	fi
}

run_backend_management() {
	local description="$1"
	shift

	print_verbose "$description"
	if ! run_compose exec -T "$BACKEND_SERVICE" "$@"; then
		print_error "$description failed"
		print_info "Recent backend logs:"
		run_compose logs --tail=80 "$BACKEND_SERVICE" || true
		exit 1
	fi
}

wait_for_backend_health() {
	local timeout_seconds="${1:-180}"
	local elapsed=0

	print_step "Waiting for backend to become healthy (timeout: ${timeout_seconds}s)"

	while [ "$elapsed" -lt "$timeout_seconds" ]; do
		if run_compose ps "$BACKEND_SERVICE" 2>/dev/null | grep -q "healthy"; then
			print_success "Backend container is healthy"
			return 0
		fi

		if run_compose ps "$BACKEND_SERVICE" 2>/dev/null | grep -q "unhealthy"; then
			print_error "Backend container is unhealthy"
			print_info "Recent backend logs:"
			run_compose logs --tail=120 "$BACKEND_SERVICE" || true
			return 1
		fi

		sleep 5
		elapsed=$((elapsed + 5))
	done

	print_error "Backend health check timed out after ${timeout_seconds}s"
	print_info "Recent backend logs:"
	run_compose logs --tail=120 "$BACKEND_SERVICE" || true
	return 1
}

# -----------------------------------------------------------------------------
# Environment loaders
# -----------------------------------------------------------------------------

sync_environment_file() {
	if [ -f "${PROJECT_PATH}/.env.staging" ]; then
		cp -f "${PROJECT_PATH}/.env.staging" "$ENV_FILE"
		print_verbose "Applied .env.staging to .env"
	elif [ ! -f "$ENV_FILE" ]; then
		print_error "Neither .env.staging nor .env found in: $PROJECT_PATH"
		exit 1
	else
		print_warning ".env.staging not found, using existing .env"
	fi
}

load_environment() {
	if [ ! -f "$ENV_FILE" ]; then
		print_error ".env file not found at: $ENV_FILE"
		exit 1
	fi

	get_env_value() {
		local key="$1"
		awk -F'=' -v search_key="$key" '$1 == search_key { sub(/\r$/, "", $2); print substr($0, index($0, "=") + 1); exit }' "$ENV_FILE"
	}

	DB_NAME="$(get_env_value "DB_NAME")"
	DB_USER="$(get_env_value "DB_USER")"
	DB_PASSWORD="$(get_env_value "DB_PASSWORD")"
	DB_HOST="$(get_env_value "DB_HOST")"
	DB_PORT="$(get_env_value "DB_PORT")"

	FRONTEND_SITE_URL="$(get_env_value "FRONTEND_SITE_URL")"
	BACKEND_SITE_URL="$(get_env_value "BACKEND_SITE_URL")"
	BACKEND_HOST_PORT="$(get_env_value "BACKEND_HOST_PORT")"

	# Fallback to KM keys if LM-style keys are absent.
	if [ -z "$FRONTEND_SITE_URL" ]; then
		FRONTEND_SITE_URL="$(get_env_value "FRONTEND_URL")"
	fi
	if [ -z "$BACKEND_SITE_URL" ]; then
		local vite_api_url
		vite_api_url="$(get_env_value "VITE_API_URL")"
		if [ -n "$vite_api_url" ]; then
			BACKEND_SITE_URL="$vite_api_url"
		fi
	fi

	: "${DB_NAME:?DB_NAME is required in .env}"
	: "${DB_USER:?DB_USER is required in .env}"
	: "${DB_PASSWORD:?DB_PASSWORD is required in .env}"
	: "${DB_HOST:?DB_HOST is required in .env}"

	DB_PORT="${DB_PORT:-5432}"
	FRONTEND_SITE_URL="${FRONTEND_SITE_URL:-https://kms.khaz.app}"
	BACKEND_SITE_URL="${BACKEND_SITE_URL:-https://kms-be.khaz.app}"
	BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8002}"
}

# -----------------------------------------------------------------------------
# Argument parsing and prerequisites
# -----------------------------------------------------------------------------

parse_arguments() {
	while [[ $# -gt 0 ]]; do
		case $1 in
			--mode)
				MODE="$2"
				shift 2
				;;
			--verbose)
				VERBOSE="true"
				shift
				;;
			--help)
				show_help
				exit 0
				;;
			*)
				print_error "Unknown option: $1"
				show_help
				exit 1
				;;
		esac
	done

	case "$MODE" in
		full-clean-build|update-only|update-with-data-refresh)
			;;
		*)
			print_error "Invalid mode: $MODE"
			show_help
			exit 1
			;;
	esac
}

check_prerequisites() {
	print_step "Checking prerequisites"

	if ! command -v docker >/dev/null 2>&1; then
		print_error "Docker not installed"
		exit 1
	fi
	print_verbose "Docker installed"

	if command -v docker-compose >/dev/null 2>&1; then
		COMPOSE_BIN="docker-compose"
	elif docker compose version >/dev/null 2>&1; then
		COMPOSE_BIN="docker compose"
	else
		print_error "Docker Compose not installed"
		exit 1
	fi
	print_verbose "Compose command: ${COMPOSE_BIN}"

	if ! command -v git >/dev/null 2>&1; then
		print_error "Git not installed"
		exit 1
	fi
	print_verbose "Git installed"

	if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
		print_error "docker-compose.yml not found at: $PROJECT_PATH"
		exit 1
	fi
	print_verbose "Project directory found"

	if ! docker info >/dev/null 2>&1; then
		print_error "Docker daemon is not running"
		exit 1
	fi
	print_verbose "Docker daemon running"

	sync_environment_file
	load_environment
	print_verbose "Environment loaded"

	print_success "All prerequisites met"
}

# -----------------------------------------------------------------------------
# Backup and git operations
# -----------------------------------------------------------------------------

backup_database() {
	print_step "Backing up database"
	mkdir -p "$BACKUP_DIR"
	local temp_backup_file="${DB_BACKUP_FILE}.tmp"

	if ! docker ps --filter "name=${BACKEND_CONTAINER}" --filter "status=running" --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
		print_warning "Backend container not running; skipping DB backup"
		return 0
	fi

	if run_compose exec -T "$BACKEND_SERVICE" env PGPASSWORD="$DB_PASSWORD" \
		pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
		> "$temp_backup_file" 2>"${BACKUP_DIR}/db_backup_error_${BACKUP_TIMESTAMP}.log"; then
		mv "$temp_backup_file" "$DB_BACKUP_FILE"
		print_success "Database backed up to: $DB_BACKUP_FILE"
		print_verbose "Backup size: $(du -h "$DB_BACKUP_FILE" | cut -f1)"
		return 0
	else
		rm -f "$temp_backup_file"
		print_warning "Database backup failed (continuing)"
		print_warning "See: ${BACKUP_DIR}/db_backup_error_${BACKUP_TIMESTAMP}.log"
		return 0
	fi
}

backup_application() {
	print_step "Backing up application files"
	mkdir -p "$BACKUP_DIR"

	if tar -czf "${APP_BACKUP_DIR}.tar.gz" \
		--exclude='.git' \
		--exclude='backups' \
		--exclude='node_modules' \
		--exclude='venv' \
		--exclude='__pycache__' \
		--exclude='staticfiles' \
		-C "$(dirname "$PROJECT_PATH")" "$(basename "$PROJECT_PATH")" 2>/dev/null; then
		print_success "Application backed up to: ${APP_BACKUP_DIR}.tar.gz"
		print_verbose "Backup size: $(du -h "${APP_BACKUP_DIR}.tar.gz" | cut -f1)"
		return 0
	else
		print_warning "Application backup failed (non-critical, continuing)"
		return 0
	fi
}

pull_latest_code() {
	print_step "Pulling latest code from git"
	cd "$PROJECT_PATH"

	# Ignore chmod-only noise on Linux servers (common after first chmod +x).
	git config core.fileMode false >/dev/null 2>&1 || true

	if ! git diff --quiet --ignore-submodules -- || ! git diff --cached --quiet --; then
		print_error "Working tree has local changes. Commit/stash/discard before deployment."
		git status --short || true
		return 1
	fi

	local current_branch
	current_branch="$(git branch --show-current)"
	print_verbose "Current branch: ${current_branch}"

	if ! git fetch origin main; then
		print_error "git fetch failed"
		return 1
	fi

	if ! git pull --ff-only origin main; then
		print_error "git pull failed (non fast-forward or conflict)"
		return 1
	fi

	print_success "Code pulled successfully"
}

# -----------------------------------------------------------------------------
# Deployment modes
# -----------------------------------------------------------------------------

deploy_full_clean_build() {
	print_header "DEPLOYMENT MODE: Full Clean Build"
	print_warning "This mode removes containers and volumes. Data can be lost."
	read -r -p "Press Enter to continue or Ctrl+C to cancel: "

	# Fail fast: never stop running services until git pull succeeds.
	pull_latest_code || return 1

	backup_database
	backup_application

	cd "$PROJECT_PATH"
	print_verbose "Stopping containers and removing volumes"
	run_compose down -v 2>/dev/null || true

	print_verbose "Building images without cache"
	run_compose build --no-cache || return 1

	print_verbose "Starting containers"
	run_compose up -d || return 1

	wait_for_backend_health 240 || exit 1
	run_backend_management "Running Django system checks" python manage.py check

	print_verbose "Container status"
	run_compose ps

	print_success "Full clean build completed"
	return 0
}

deploy_update_only() {
	print_header "DEPLOYMENT MODE: Update Only"

	cd "$PROJECT_PATH"
	pull_latest_code || return 1

	print_verbose "Building images with cache"
	run_compose build || return 1

	print_verbose "Restarting containers"
	run_compose down || return 1
	run_compose up -d || return 1

	wait_for_backend_health 240 || exit 1
	run_backend_management "Running Django system checks" python manage.py check
	run_backend_management "Running migrations" python manage.py migrate --noinput

	print_verbose "Container status"
	run_compose ps

	print_success "Update deployment completed"
	return 0
}

deploy_update_with_data_refresh() {
	print_header "DEPLOYMENT MODE: Update with Data Refresh"
	
	# Pull first to avoid taking backups for a deployment that cannot proceed.
	pull_latest_code || return 1

	backup_database
	backup_application

	cd "$PROJECT_PATH"

	print_verbose "Building images"
	run_compose build || return 1

	print_verbose "Restarting containers"
	run_compose down || return 1
	run_compose up -d || return 1

	wait_for_backend_health 240 || exit 1
	run_backend_management "Running Django system checks" python manage.py check
	run_backend_management "Running migrations" python manage.py migrate --noinput
	run_backend_management "Collecting static files" python manage.py collectstatic --noinput --clear

	print_verbose "Container status"
	run_compose ps

	print_success "Update with data refresh deployment completed"
	return 0
}

# -----------------------------------------------------------------------------
# Runtime verification and summary
# -----------------------------------------------------------------------------

verify_runtime_health() {
	print_step "Verifying backend runtime health"

	if ! docker ps --filter "name=${BACKEND_CONTAINER}" --filter "status=running" --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
		print_error "Backend container is not running (${BACKEND_CONTAINER})"
		print_info "Last backend logs:"
		run_compose logs --tail=80 "$BACKEND_SERVICE" || true
		return 1
	fi

	if ! run_compose exec -T "$BACKEND_SERVICE" python manage.py check >/dev/null 2>&1; then
		print_error "Django system check failed inside backend container"
		print_info "Last backend logs:"
		run_compose logs --tail=80 "$BACKEND_SERVICE" || true
		return 1
	fi

	if command -v curl >/dev/null 2>&1; then
		local local_health_url="http://127.0.0.1:${BACKEND_HOST_PORT}/health/"
		if ! curl -fsS --max-time 15 "$local_health_url" >/dev/null; then
			print_error "Local backend health check failed at: $local_health_url"
			print_info "Backend /health response body:"
			curl -sS --max-time 15 "$local_health_url" || true
			print_info "Recent backend logs:"
			run_compose logs --tail=120 "$BACKEND_SERVICE" || true
			return 1
		fi

		local cors_header
		cors_header="$(curl -sSI -H "Origin: ${FRONTEND_SITE_URL}" --max-time 20 "${BACKEND_SITE_URL}/health/" | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin" {print $2; exit}')"
		if [ "$cors_header" != "$FRONTEND_SITE_URL" ]; then
			print_error "CORS verification failed via public API domain"
			print_info "Expected Access-Control-Allow-Origin: ${FRONTEND_SITE_URL}"
			print_info "Actual Access-Control-Allow-Origin: ${cors_header:-<missing>}"
			return 1
		fi
	else
		print_warning "curl not found; skipped HTTP/CORS runtime verification"
	fi

	if ! docker ps --filter "name=${FRONTEND_CONTAINER}" --filter "status=running" --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER}$"; then
		print_error "Frontend container is not running (${FRONTEND_CONTAINER})"
		print_info "Recent frontend logs:"
		run_compose logs --tail=120 frontend || true
		return 1
	fi

	if command -v curl >/dev/null 2>&1; then
		if ! curl -fsS --max-time 15 "http://127.0.0.1:5175/" >/dev/null; then
			print_error "Local frontend health check failed at: http://127.0.0.1:5175/"
			print_info "Recent frontend logs:"
			run_compose logs --tail=120 frontend || true
			return 1
		fi
	fi

	print_success "Backend runtime and CORS verification passed"
}

show_deployment_info() {
	print_header "Deployment Complete"

	print_info "Application endpoints:"
	print_info "  Frontend: ${FRONTEND_SITE_URL}"
	print_info "  Backend API: ${BACKEND_SITE_URL}/api/v1/"
	print_info "  Admin Panel: ${BACKEND_SITE_URL}/admin/"
	print_info ""
	print_info "Backups:"
	print_info "  Directory: ${BACKUP_DIR}"
	print_info "  Latest DB backup: ${DB_BACKUP_FILE}"
	print_info ""
	print_info "Useful commands:"
	print_info "  View logs: ${COMPOSE_BIN} logs -f"
	print_info "  Container status: ${COMPOSE_BIN} ps"
	print_info "  Restart backend: ${COMPOSE_BIN} restart ${BACKEND_SERVICE}"
}

main() {
	parse_arguments "$@"

	if [ -z "$MODE" ]; then
		print_error "Mode is required"
		show_help
		exit 1
	fi

	print_header "KMSetjen DPD RI - Staging Server Deployment"
	print_info "Mode: $MODE"
	print_info "Project Path: $PROJECT_PATH"

	check_prerequisites

	case "$MODE" in
		full-clean-build)
			deploy_full_clean_build
			;;
		update-only)
			deploy_update_only
			;;
		update-with-data-refresh)
			deploy_update_with_data_refresh
			;;
	esac

	verify_runtime_health || exit 1
	run_compose ps
	show_deployment_info
	print_success "All deployment steps completed successfully"
}

main "$@"

