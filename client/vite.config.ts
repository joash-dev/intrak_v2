import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        // Allow automatic chunk splitting
      }
    },
    // Optimize assets
    assetsInlineLimit: 4096,
    // Enable gzip compression
    minify: 'terser'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'react-hot-toast'
    ]
  }
})
