import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'images': path.resolve(__dirname, './public/images')  // Alias pour les images
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://sos.francecourtage.fr',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (/\.png$/.test(assetInfo.name ?? '')) {
            return 'images/[name][extname]';  // Copie les images dans 'dist/images/'
          }
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
