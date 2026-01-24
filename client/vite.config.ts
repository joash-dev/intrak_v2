import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo_intrak.png'],
      manifest: {
        name: 'INTRAK',
        short_name: 'INTRAK',
        description: 'OJT Management System',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo_intrak.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_intrak.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Don't fallback to index.html for API routes
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  resolve: {
    alias: {
      canvas: 'location',
    }
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'esnext',
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
