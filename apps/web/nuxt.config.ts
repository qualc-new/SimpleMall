export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
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
