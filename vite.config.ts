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
    // Proxy Pulp API requests during development
    // Ensure Pulp backend is running at http://localhost:8080
    proxy: {
      '/pulp': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
