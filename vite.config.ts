import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@engines': path.resolve(import.meta.dirname, './src/engines'),
      '@crypto': path.resolve(import.meta.dirname, './src/crypto'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@store': path.resolve(import.meta.dirname, './src/store'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
