# ==============================================================================
# Multi-stage Dockerfile for Django KMS Application
# ==============================================================================
# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
# CRITICAL: Include image processing libraries for Pillow compilation
# These are needed for image validation (JPEG, PNG, WebP, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ==============================================================================
# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime system dependencies
# CRITICAL: Image processing libraries MUST be included for Pillow/PIL to work
# Without these, avatar uploads fail with "cannot identify image file" error
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    netcat-traditional \
    libjpeg62-turbo \
    libpng16-16 \
    libwebp7 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 django && \
    mkdir -p /app/logs /app/staticfiles /app/media && \
    chown -R django:django /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/django/.local

# Copy application code
COPY --chown=django:django . .

# Set environment variables
ENV PATH=/home/django/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && chown django:django /app/logs

# Copy entrypoint script BEFORE USER directive so it runs as root
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod -v +x /app/entrypoint.sh && ls -la /app/entrypoint.sh

# Set entrypoint with shell interpreter (runs as root initially, then switches to django at end)
ENTRYPOINT ["bash", "/app/entrypoint.sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8002/health/ || exit 1

# Collect static files
RUN python manage.py collectstatic --noinput --clear || true

# Expose port
EXPOSE 8002

# Start application with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8002", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "config.wsgi:application"]
