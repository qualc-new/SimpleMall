import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const sharedRoot = path.resolve(__dirname, '../../packages/shared');

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 不预构建 workspace 包，避免缓存旧版 dist 导致缺少 SPU_STATUS_LABEL 等导出
  optimizeDeps: {
    exclude: ['@simplemall/shared'],
  },
  resolve: {
    alias: {
      '@simplemall/shared': path.join(
        sharedRoot,
        command === 'serve' ? 'src/index.ts' : 'dist/esm/index.js',
      ),
    },
    conditions: ['development', 'import', 'module', 'browser', 'default'],
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
}));
