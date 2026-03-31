import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration for KMSetjen DPD RI Frontend
 * 
 * Frontend Configuration:
 * - Port: 5175 (FIXED)
 * - API Proxy: /api → http://localhost:8002
 * - Build output: dist/
 * - Source maps: disabled in production
 */

export default defineConfig({
  plugins: [react()],
  
  // ========================================================================
  // Base path configuration for subpath deployment
  // Development: '/' (root)
  // Production: '/kmsetjendpdri/' (subpath on khaz.app)
  // ========================================================================
  base: process.env.VITE_APP_SUBPATH || '/',
  
  server: {
    port: 5175,
    host: true,  // Listen on all interfaces
    
    proxy: {
      // Proxy all /api requests to backend on port 8002
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path,  // Keep path as-is
      },
      // Also proxy /kmsetjendpdri/api for production-like development
      '/kmsetjendpdri/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kmsetjendpdri/, ''),  // Strip subpath
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap-vendor': ['bootstrap', 'react-bootstrap'],
          'utils': ['axios', 'date-fns', 'marked'],
        },
      },
    },
  },

  preview: {
    port: 5175,
  },

  // Environment variable prefix for client-side code
  envPrefix: 'VITE_',
})
