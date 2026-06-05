/** Vite `base` 去掉末尾斜杠，本地 `/`、TCB 静态托管 `/admin` */
export function getAdminRouterBasename(): string | undefined {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return base || undefined;
}

/** 管理端站内绝对路径（含 base，供 `window.location` 使用） */
export function adminAbsolutePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getAdminRouterBasename();
  return base ? `${base}${normalized}` : normalized;
}
