import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend wird direkt ausgeliefert, API unter /api/files.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' },
  server: {
    proxy: {
      '/api/files': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
