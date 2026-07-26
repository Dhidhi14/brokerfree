import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'router'
          }

          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query'
          }

          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('node_modules/zod')
          ) {
            return 'forms'
          }

          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'socket'
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          if (id.includes('@radix-ui')) {
            return 'radix'
          }

          return 'vendor'
        },
      },
    },
  },
})
