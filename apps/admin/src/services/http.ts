import axios, { AxiosError } from 'axios';
import { clearStoredToken, getStoredToken, setStoredToken } from './authStorage';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => {
    const body = res.data as { code: number; message: string; data: unknown };
    if (body && typeof body.code === 'number') {
      if (body.code !== 0) {
        return Promise.reject(new Error(body.message || '请求失败'));
      }
      res.data = body.data;
    }
    return res;
  },
  (error: AxiosError<{ message?: string; code?: number }>) => {
    const msg =
      error.response?.data?.message ||
      (error.response?.status === 401 ? '未登录或账号密码错误' : undefined) ||
      error.message;
    return Promise.reject(new Error(msg));
  },
);

export function setToken(token: string) {
  setStoredToken(token);
}

export function clearToken() {
  clearStoredToken();
}

export function getToken() {
  return getStoredToken();
}
