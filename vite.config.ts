import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Use port 5174 for E2E tests to avoid conflicts with other projects
    port: process.env.E2E_TEST ? 5174 : 5173,
    // Listen on all interfaces for Docker container access
    host: process.env.E2E_CONTAINERIZED ? '0.0.0.0' : 'localhost',
    // Allow 'ui' hostname in containerized mode (Docker network uses service name as hostname)
    allowedHosts: process.env.E2E_CONTAINERIZED ? ['ui', 'localhost'] : ['localhost'],
    // Proxy Pulp API requests to the backend
    // During containerized E2E tests, use 'pulp' hostname (Docker network)
    // During local E2E tests, use port 24817 (internal API) as nginx on 8080 may not be ready
    // During development, use port 8080 (nginx)
    proxy: {
      '/pulp': {
        target: process.env.E2E_CONTAINERIZED
          ? 'http://pulp:24817'
          : process.env.E2E_TEST
            ? 'http://localhost:24817'
            : 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          // Remove WWW-Authenticate header to prevent browser Basic Auth popup
          // This allows the frontend to handle 401 errors gracefully
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['www-authenticate']
          })
        },
      },
    },
  },
})
