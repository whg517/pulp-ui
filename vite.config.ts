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
    // Proxy Pulp API requests to the backend
    // During E2E tests, use port 24817 (internal API) as nginx on 8080 may not be ready
    // During development, use port 8080 (nginx)
    proxy: {
      '/pulp': {
        target: process.env.E2E_TEST ? 'http://localhost:24817' : 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
