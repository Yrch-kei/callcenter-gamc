import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: '0.0.0.0',
    proxy: {
      // Redirigir peticiones del backend GAMC a Node.js (puerto 4000)
      '/api': {
        target: 'http://gamc_backend:4000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy al microservicio Whisper (puerto 5000)
      '/whisper': {
        target: 'http://whisper:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/whisper/, ''),
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
  },
});