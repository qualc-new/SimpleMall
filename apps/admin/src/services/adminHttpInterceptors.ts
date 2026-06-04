import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  handleAdminUnauthorized,
  isAdminAuthError,
  isLoginRequestUrl,
} from './adminUnauthorized';

type ApiBody = { code?: number; message?: string; data?: unknown };

function rejectUnauthorized(config: InternalAxiosRequestConfig | undefined, message: string) {
  if (config && !isLoginRequestUrl(config.url)) {
    handleAdminUnauthorized();
  }
  return Promise.reject(new Error(message));
}

export function applyAdminHttpInterceptors(client: AxiosInstance) {
  client.interceptors.response.use(
    (res: AxiosResponse<ApiBody>) => {
      const body = res.data;
      if (body && typeof body.code === 'number') {
        if (isAdminAuthError(undefined, body.code)) {
          return rejectUnauthorized(res.config, body.message || '未登录或登录已过期');
        }
        if (body.code !== 0) {
          return Promise.reject(new Error(body.message || '请求失败'));
        }
        res.data = body.data;
      }
      return res;
    },
    (error: AxiosError<ApiBody>) => {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      if (isAdminAuthError(status, code) && !isLoginRequestUrl(error.config?.url)) {
        handleAdminUnauthorized();
      }
      const msg =
        error.response?.data?.message ||
        (status === 401 ? '未登录或登录已过期' : undefined) ||
        error.message;
      return Promise.reject(new Error(msg));
    },
  );
}
