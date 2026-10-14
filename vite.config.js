import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/delta': {
        target: 'https://api.india.delta.exchange',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/delta/, ''),
        secure: false,
      },
      '/api/telegram': {
        target: 'http://127.0.0.1:5055',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
