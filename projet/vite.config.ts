import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',
  server: {
    proxy: {
      // Proxy pour les requêtes API
      '/api': 'http://pc235.fcourtage1.local:81', // Changez cette URL si nécessaire
    },
  },
});
