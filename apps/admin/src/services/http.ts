import axios from 'axios';
import { getStoredToken, setStoredToken, clearStoredToken } from './authStorage';
import { applyAdminHttpInterceptors } from './adminHttpInterceptors';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

applyAdminHttpInterceptors(http);

export function setToken(token: string) {
  setStoredToken(token);
}

export function clearToken() {
  clearStoredToken();
}

export function getToken() {
  return getStoredToken();
}
