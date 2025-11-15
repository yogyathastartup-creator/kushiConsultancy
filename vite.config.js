import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0', // Expose to network
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'validation': ['validator', 'dompurify', 'isomorphic-dompurify'],
          'emailjs': ['emailjs-com']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
});