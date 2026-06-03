export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  return $fetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      if (auth.accessToken) {
        const headers = new Headers(options.headers as HeadersInit);
        headers.set('Authorization', `Bearer ${auth.accessToken}`);
        options.headers = headers;
      }
    },
    onResponse({ response }) {
      const body = response._data as { code?: number; message?: string; data?: unknown };
      if (body && typeof body.code === 'number') {
        if (body.code !== 0) {
          throw createError({ statusCode: 400, message: body.message || '请求失败', data: body });
        }
        response._data = body.data;
      }
    },
  });
}

export function unwrap<T>(res: { data: T } | T): T {
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    return (res as { data: T }).data;
  }
  return res as T;
}
