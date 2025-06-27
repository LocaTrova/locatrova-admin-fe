import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1600,
  },
  // Environment variables prefix
  envPrefix: 'VITE_',
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  esbuild: {
    target: 'esnext',
  }
})
