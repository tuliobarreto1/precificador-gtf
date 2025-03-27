
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Garantir que as variáveis de ambiente estejam disponíveis
    'process.env.VITE_DB_SERVER': JSON.stringify(process.env.VITE_DB_SERVER),
    'process.env.VITE_DB_PORT': JSON.stringify(process.env.VITE_DB_PORT),
    'process.env.VITE_DB_USER': JSON.stringify(process.env.VITE_DB_USER),
    'process.env.VITE_DB_PASSWORD': JSON.stringify(process.env.VITE_DB_PASSWORD),
    'process.env.VITE_DB_DATABASE': JSON.stringify(process.env.VITE_DB_DATABASE),
  },
  server: {
    port: 8080,
    proxy: {
      // Configuração de proxy para desenvolvimento
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
