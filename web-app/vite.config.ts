import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Theater Service (Port 8082)
      '^/api/movies/[^/]+/showtimes': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/theaters': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/admin/theaters': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/auditoriums': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/admin/auditoriums': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/showtimes': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/admin/showtimes': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Booking Service (Port 8083)
      '/api/bookings': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // Movie Service (Port 8081 - fallback for /api/movies, /api/genres, /api/admin/movies, etc.)
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})


