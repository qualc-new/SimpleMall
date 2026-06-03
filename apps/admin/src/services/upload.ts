import { http } from './http';

/** 上传图片到管理端，返回可访问 URL（走 Vite /api 代理） */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await http.post<{ url: string }>('/admin/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
