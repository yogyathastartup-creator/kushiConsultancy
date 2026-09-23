import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  base: '/', // Ensure correct base path for Vercel
  server: {
    port: 5174,
    host: '0.0.0.0', // Expose to network
    open: true,
  },
  esbuild: {
    // Strip console.* and debugger statements from production builds so nothing
    // leaks into the browser console once deployed. `npm run dev` is unaffected,
    // so console logging still works in the local environment.
    drop: command === 'build' && mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'validation': ['validator', 'dompurify', 'isomorphic-dompurify']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
}));