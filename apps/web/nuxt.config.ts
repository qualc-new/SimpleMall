import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  // 开发态关闭 DevTools，减少 vite-node 子进程与 IPC socket 异常（ENOENT）
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' },
  // 避免 macOS 上 dev 被强杀后 nuxt-vite-node-*.sock 连接失败（Nuxt 3.16+）
  experimental: {
    viteEnvironmentApi: false,
    // 避免 dev 启动阶段 Vite 预转换无法解析 #app-manifest（常与 .nuxt 未生成或 vite-node 中断有关）
    appManifest: false,
  },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  vite: {
    resolve: {
      alias: {
        '@simplemall/shared': fileURLToPath(
          new URL('../../packages/shared/dist/esm/index.js', import.meta.url),
        ),
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1',
    },
  },
  routeRules: {
    '/cart': { ssr: false },
    '/checkout': { ssr: false },
    '/orders/**': { ssr: false },
    '/user/**': { ssr: false },
    '/login': { ssr: false },
    '/register': { ssr: false },
  },
  compatibilityDate: '2024-11-01',
});
