export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  auth.hydrate();
  if (!auth.accessToken) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
