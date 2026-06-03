/** 管理端登录态：使用 localStorage，同域多标签页共享；兼容旧版 sessionStorage */

const TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

function read(key: string): string | null {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return fromLocal;
  const fromSession = sessionStorage.getItem(key);
  if (fromSession) {
    localStorage.setItem(key, fromSession);
    sessionStorage.removeItem(key);
    return fromSession;
  }
  return null;
}

function write(key: string, value: string) {
  localStorage.setItem(key, value);
  sessionStorage.removeItem(key);
}

function remove(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function getStoredToken(): string | null {
  return read(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  write(TOKEN_KEY, token);
}

export function clearStoredToken() {
  remove(TOKEN_KEY);
}

export function getStoredAdminJson(): string | null {
  return read(ADMIN_USER_KEY);
}

export function setStoredAdminJson(json: string) {
  write(ADMIN_USER_KEY, json);
}

export function clearStoredAdmin() {
  remove(ADMIN_USER_KEY);
}

export function clearAllAuthStorage() {
  clearStoredToken();
  clearStoredAdmin();
}
