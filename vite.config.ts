import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
