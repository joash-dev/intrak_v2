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
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          ui: ['react-hot-toast'],
          // Feature-based chunks
          student: [
            './src/pages/StudentUi/Dashboard.tsx',
            './src/pages/StudentUi/StudentDocumentsTab.tsx',
            './src/pages/StudentUi/StudentTemplates.tsx'
          ],
          instructor: [
            './src/pages/InstructorUi/DashboardInstructor.tsx',
            './src/pages/InstructorUi/InstructorDocuments.tsx'
          ],
          coordinator: [
            './src/pages/CoordinatorUi/DashboardCoordinator.tsx',
            './src/pages/CoordinatorUi/CoordinatorDocumentsTab.tsx'
          ]
        }
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
