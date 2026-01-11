import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@nvim': resolve(__dirname, 'src/nvim-engine'),
      '@challenge': resolve(__dirname, 'src/challenge-engine'),
      '@storage': resolve(__dirname, 'src/storage'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        challenge: resolve(__dirname, 'src/challenge/page.html'),
        builder: resolve(__dirname, 'src/builder/page.html'),
      },
    },
    sourcemap: process.env.NODE_ENV === 'development',
  },
});
