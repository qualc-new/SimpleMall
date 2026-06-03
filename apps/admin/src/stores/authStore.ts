export interface AdminInfo {
  id: number;
  username: string;
  role: string;
}

let adminCache: AdminInfo | null = null;

export function setAdmin(admin: AdminInfo) {
  adminCache = admin;
  sessionStorage.setItem('admin_user', JSON.stringify(admin));
}

export function getAdmin(): AdminInfo | null {
  if (adminCache) return adminCache;
  const raw = sessionStorage.getItem('admin_user');
  if (!raw) return null;
  adminCache = JSON.parse(raw) as AdminInfo;
  return adminCache;
}

export function clearAdmin() {
  adminCache = null;
  sessionStorage.removeItem('admin_user');
}
