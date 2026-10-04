import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://backend:3000'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 18123,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
