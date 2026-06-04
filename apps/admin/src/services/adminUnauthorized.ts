import { clearAdmin } from '../stores/authStore';
import { clearStoredToken } from './authStorage';

let handling = false;

/** 接口 401 / 40100 时清除登录态并跳转登录页 */
export function handleAdminUnauthorized() {
  if (handling || typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  handling = true;
  clearStoredToken();
  clearAdmin();
  window.location.replace('/login');
}

export function isAdminAuthError(status?: number, code?: number) {
  return status === 401 || code === 40100;
}

export function isLoginRequestUrl(url?: string) {
  return !!url?.includes('/admin/auth/login');
}
