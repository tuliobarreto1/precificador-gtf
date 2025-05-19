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
    // Adicionando o host à lista de hosts permitidos
    allowedHosts: ["21f4302d-167e-4f68-952e-c29e49930b44.lovableproject.com"],
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      }
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
    // Reduzir o tamanho do sourcemap para economizar memória
    sourcemap: 'hidden',
    // Aumentar o limite de aviso de tamanho de chunk
    chunkSizeWarningLimit: 1000,
    // Minimizar melhor o código com Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remover console.logs em produção
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Otimizar uso de memória durante o build
    rollupOptions: {
      output: {
        // Dividir o build em chunks menores para economizar memória
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom'
          ],
          ui: [
            '@/components/ui',
          ],
        },
        // Limitar o número de chunks paralelos processados
        experimentalMinChunkSize: 10000,
      },
      // Forçar o uso do Rollup JavaScript em vez da versão nativa
      context: 'globalThis'
    },
    // Desativar a compressão Brotli para economizar memória durante o build
    brotliSize: false,
    // Usar esbuild para transpilação mais rápida e eficiente na memória
    cssCodeSplit: true,
    // Reduzir o uso de workers em ambientes com pouca memória
    reportCompressedSize: false
  }
}))