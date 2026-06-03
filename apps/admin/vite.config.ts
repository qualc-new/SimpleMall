import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 预构建 workspace 包，确保走 package.json exports.import (ESM)
  optimizeDeps: {
    include: ['@simplemall/shared'],
  },
  resolve: {
    alias: {
      '@simplemall/shared': path.resolve(__dirname, '../../packages/shared/dist/esm/index.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
