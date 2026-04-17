import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // ✅ Environment variables configuration
  define: {
    // Global'de import.meta.env değerleri otomatik olarak kullanılabilir
  },
  server: {
    // Development server configuration
    port: 5173,
    strictPort: false,
    open: false,
  },
  build: {
    // Production build configuration
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Production'da console.log'ları kaldır
      },
    },
    // ✅ CODE SPLITTING CONFIGURATION
    rollupOptions: {
      output: {
        // Manual chunks - stratejik kod parçalama
        manualChunks(id) {
          // ✅ 1. VENDOR chunks (node_modules)
          if (id.includes('/node_modules/')) {
            // Firebase kütüphaneleri ayrı chunk
            if (id.includes('/node_modules/firebase')) {
              return 'vendor-firebase';
            }
            // React ve plugin'leri ayrı
            if (id.includes('/node_modules/react')) {
              return 'vendor-react';
            }
            // Diğer vendor'lar
            return 'vendor-other';
          }
          
          // ✅ 2. MODULE chunks (training modules) - circular deps'ten kaçın
          if (id.includes('/modules/FlashRead')) return 'module-flashread';
          if (id.includes('/modules/GuidedRead')) return 'module-guided';
          if (id.includes('/modules/Schulte')) return 'module-schulte';
          if (id.includes('/modules/VisualMemory')) return 'module-visual';
          if (id.includes('/modules/DailyChallenge')) return 'module-daily';
          if (id.includes('/modules/')) return 'modules-other';
          
          // ✅ 3. VIEW chunks (separate from modules to avoid cycles)
          if (id.includes('/views/')) {
            if (id.includes('/views/Dashboard')) return 'view-dashboard';
            if (id.includes('/views/Profile')) return 'view-profile';
            if (id.includes('/views/SocialHub')) return 'view-social';
            return 'views-other';
          }
          
          // ✅ 4. ADMIN chunk (lazy loaded)
          if (id.includes('/admin/')) {
            return 'admin';
          }
        },
      },
    },
    // ✅ Chunk size warnings configuration
    chunkSizeWarningLimit: 600, // Increased to suppress warnings for now
  },
  // ✅ EXPERIMENTAL OPTIMIZATIONS
  experimental: {
    // renderBuiltUrl: (filename) => {
    //   return `/static/${filename}`
    // }
  },
})
