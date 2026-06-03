import { defineStore } from 'pinia';

interface UserInfo {
  id: number;
  phone: string;
  nickname?: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserInfo | null,
    accessToken: '' as string,
  }),
  actions: {
    hydrate() {
      if (import.meta.client) {
        this.accessToken = localStorage.getItem('sm_access_token') || '';
        const raw = localStorage.getItem('sm_user');
        this.user = raw ? JSON.parse(raw) : null;
      }
    },
    async login(phone: string, password: string) {
      const api = useApi();
      const data = await api<{ accessToken: string; user: UserInfo }>('/auth/login', {
        method: 'POST',
        body: { phone, password },
      });
      this.accessToken = data.accessToken;
      this.user = data.user;
      if (import.meta.client) {
        localStorage.setItem('sm_access_token', this.accessToken);
        localStorage.setItem('sm_user', JSON.stringify(this.user));
      }
    },
    logout() {
      this.accessToken = '';
      this.user = null;
      if (import.meta.client) {
        localStorage.removeItem('sm_access_token');
        localStorage.removeItem('sm_user');
      }
      navigateTo('/');
    },
  },
});
