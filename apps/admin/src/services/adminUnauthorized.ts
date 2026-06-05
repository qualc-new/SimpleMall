import { clearAdmin } from '../stores/authStore';
import { adminAbsolutePath } from '../utils/basePath';
import { clearStoredToken } from './authStorage';

let handling = false;

/** 接口 401 / 40100 时清除登录态并跳转管理端登录页（TCB 子路径 /admin 下勿跳到商城 /login） */
export function handleAdminUnauthorized() {
  if (handling || typeof window === 'undefined') return;
  const loginPath = adminAbsolutePath('/login');
  if (window.location.pathname === loginPath) return;
  handling = true;
  clearStoredToken();
  clearAdmin();
  window.location.replace(loginPath);
}

export function isAdminAuthError(status?: number, code?: number) {
  return status === 401 || code === 40100;
}

export function isLoginRequestUrl(url?: string) {
  return !!url?.includes('/admin/auth/login');
}
