import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const sharedSrc = path.resolve(__dirname, '../../packages/shared/src/index.ts');

export default defineConfig({
  plugins: [react()],
  // 由 Vite 直接编译 workspace 源码，无需预构建 dist
  optimizeDeps: {
    exclude: ['@simplemall/shared'],
  },
  resolve: {
    alias: {
      '@simplemall/shared': sharedSrc,
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
