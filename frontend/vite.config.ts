/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/geofences': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/vehicles': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/locations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/violations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
