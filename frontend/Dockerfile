# ==============================================================================
# Multi-stage Dockerfile for React Frontend (Vite)
# ==============================================================================
# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install if no lock file, otherwise npm ci for reproducible builds)
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copy source code
COPY . .

# Build application with Vite (outputs to dist/)
RUN npm run build

# ==============================================================================
# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built application from builder (Vite outputs to dist/)
COPY --from=builder /app/dist ./dist

# Node:20-alpine already has a 'node' user, just use it
# Ensure proper permissions
RUN chown -R node:node /app

USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5175/ || exit 1

# Expose port
EXPOSE 5175

# Start application from dist/ directory (Vite output)
CMD ["serve", "-s", "dist", "-l", "5175"]
