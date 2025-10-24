import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      api: path.resolve(__dirname, 'src/api'),
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      types: path.resolve(__dirname, 'src/types'),
      utils: path.resolve(__dirname, 'src/utils'),       // 👈 agregado
      hooks: path.resolve(__dirname, 'src/hooks'),       // 👈 agregado
      contexts: path.resolve(__dirname, 'src/contexts'), // 👈 agregado
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1', // backend real
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api'),
      },
    },
  },
})
