import { getCurrentPath } from './useAuthExpired';

/** 未登录时打开登录弹窗，返回是否已登录 */
export function useRequireLogin() {
  const auth = useAuthStore();
  const modal = useLoginModalStore();
  const route = useRoute();

  function requireLogin(redirectPath?: string) {
    auth.hydrate();
    if (auth.accessToken) return true;
    const path =
      redirectPath ?? (import.meta.client ? getCurrentPath() : route.fullPath);
    modal.open(path);
    return false;
  }

  return { requireLogin };
}
