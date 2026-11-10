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
      // Mọi API đi qua API Gateway (port 8080): xác thực JWT, phân quyền, định tuyến tới từng service
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})


