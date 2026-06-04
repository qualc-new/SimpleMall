/** 需登录页面：未登录时弹窗；客户端导航拦截，服务端放行由接口触发弹窗 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  auth.hydrate();
  if (auth.accessToken) return;

  const modal = useLoginModalStore();
  modal.open(to.fullPath);

  if (import.meta.client) {
    return abortNavigation();
  }
});
