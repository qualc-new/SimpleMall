import {
  clearStoredAdmin,
  getStoredAdminJson,
  setStoredAdminJson,
} from '../services/authStorage';

export interface AdminInfo {
  id: number;
  username: string;
  role: string;
}

let adminCache: AdminInfo | null = null;

export function setAdmin(admin: AdminInfo) {
  adminCache = admin;
  setStoredAdminJson(JSON.stringify(admin));
}

export function getAdmin(): AdminInfo | null {
  if (adminCache) return adminCache;
  const raw = getStoredAdminJson();
  if (!raw) return null;
  adminCache = JSON.parse(raw) as AdminInfo;
  return adminCache;
}

export function clearAdmin() {
  adminCache = null;
  clearStoredAdmin();
}
