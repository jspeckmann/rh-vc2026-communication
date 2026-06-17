import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend wird direkt ausgeliefert, API unter /files.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' },
  server: {
    proxy: {
      '/files': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
});
