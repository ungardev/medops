import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost', // tu backend real
        changeOrigin: true,
        secure: false,
      },
      // opcional: si aún tienes llamadas con /api/v1
      '/api/v1': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api'),
      },
    },
  },
})