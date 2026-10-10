import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api/delta': {
        target: 'https://api.india.delta.exchange',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/delta/, ''),
        secure: false,
      }
    }
  }
})
