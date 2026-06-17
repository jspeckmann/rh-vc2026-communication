import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend wird unter /files ausgeliefert → base entsprechend setzen.
export default defineConfig({
  plugins: [react()],
  base: '/files/',
  build: { outDir: 'dist' },
});
