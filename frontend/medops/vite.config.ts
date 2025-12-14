import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      api: path.resolve(__dirname, 'src/api'),
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      types: path.resolve(__dirname, 'src/types'),
      utils: path.resolve(__dirname, 'src/utils'),
      contexts: path.resolve(__dirname, 'src/contexts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1', // 👈 backend Django
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
