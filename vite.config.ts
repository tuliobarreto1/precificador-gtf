import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      }
    },
    // Adicionando configuração para permitir o host específico
    hmr: {
      clientPort: 8080,
      host: '21f4302d-167e-4f68-952e-c29e49930b44.lovableproject.com'
    }
  },
  // Adicionar configuração para evitar problemas com o Rollup nativo
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      // Forçar o uso do Rollup JavaScript em vez da versão nativa
      context: 'globalThis'
    }
  }
}))