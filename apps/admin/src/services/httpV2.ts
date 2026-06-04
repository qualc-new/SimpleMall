import axios from 'axios';
import { getStoredToken } from './authStorage';
import { applyAdminHttpInterceptors } from './adminHttpInterceptors';

/** 管理端 v2 接口（如商城用户管理） */
export const httpV2 = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE || '/api/v2',
  timeout: 15000,
});

httpV2.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

applyAdminHttpInterceptors(httpV2);
