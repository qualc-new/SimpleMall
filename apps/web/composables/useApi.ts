let apiClient: ReturnType<typeof $fetch.create> | undefined;

export function useApi() {
  const config = useRuntimeConfig();

  if (!apiClient) {
    apiClient = $fetch.create({
      baseURL: config.public.apiBase as string,
      onRequest({ options }) {
        const auth = useAuthStore();
        auth.hydrate();
        if (auth.accessToken) {
          const headers = new Headers(options.headers as HeadersInit);
          headers.set('Authorization', `Bearer ${auth.accessToken}`);
          options.headers = headers;
        }
      },
      onResponse({ response, request }) {
        const body = response._data as { code?: number; message?: string; data?: unknown };
        if (body && typeof body.code === 'number') {
          const url = typeof request === 'string' ? request : String(request);
          if (isWebAuthError(undefined, body.code) && !isAuthApiUrl(url)) {
            handleWebUnauthorized();
            throw createError({ statusCode: 401, message: body.message || '未登录' });
          }
          if (body.code !== 0) {
            throw createError({ statusCode: 400, message: body.message || '请求失败', data: body });
          }
          response._data = body.data;
        }
      },
      onResponseError({ response, request }) {
        const body = response._data as { code?: number; message?: string } | undefined;
        const url = typeof request === 'string' ? request : String(request);
        if (isWebAuthError(response.status, body?.code) && !isAuthApiUrl(url)) {
          handleWebUnauthorized();
        }
      },
    });
  }

  return apiClient;
}

export function unwrap<T>(res: { data: T } | T): T {
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    return (res as { data: T }).data;
  }
  return res as T;
}
