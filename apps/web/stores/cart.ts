import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as Array<{ id: number; quantity: number }>,
  }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.quantity, 0),
  },
  actions: {
    async fetchCart() {
      const api = useApi();
      try {
        const res = await api<{ data: Array<{ id: number; quantity: number }> }>('/cart');
        const data = (res as { data?: typeof this.items }).data ?? res;
        this.items = Array.isArray(data) ? data : [];
      } catch {
        this.items = [];
      }
    },
    async add(skuId: number, quantity = 1) {
      const api = useApi();
      await api('/cart/items', { method: 'POST', body: { skuId, quantity } });
      await this.fetchCart();
    },
  },
});
