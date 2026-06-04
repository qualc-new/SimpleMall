/** 当前页路径，供登录弹窗登录后刷新/回跳 */
export function getCurrentPath() {
  if (!import.meta.client) return '/';
  return window.location.pathname + window.location.search;
}

export function handleWebUnauthorized() {
  const auth = useAuthStore();
  const modal = useLoginModalStore();
  auth.clearSession();
  modal.open(getCurrentPath());
}

export function isWebAuthError(status?: number, code?: number) {
  return status === 401 || code === 40100;
}

export function isAuthApiUrl(url?: string) {
  return !!url?.match(/\/auth\/(login|register)/);
}
