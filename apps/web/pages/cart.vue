<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">购物车</h1>
    <div v-if="!items.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg class="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6h15l-1.5 9H8L6 6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M6 6L5 3H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
        <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
      </svg>
      <p class="text-base">购物车是空的</p>
      <NuxtLink to="/" class="mt-4 text-sm text-emerald-600 underline">去逛逛</NuxtLink>
    </div>
    <ul v-else class="space-y-3">
      <li v-for="row in items" :key="row.id" class="bg-white p-4 rounded-lg shadow flex gap-4 items-start">
        <input v-model="row.selected" type="checkbox" :disabled="!row.valid" @change="toggle(row)" />
        <img :src="row.sku.mainImage" class="w-20 h-20 object-cover rounded" alt="" />
        <div class="flex-1">
          <p class="font-medium">{{ row.sku.spuTitle }}</p>
          <p class="text-sm text-gray-500">{{ specText(row.sku.specs) }}</p>
          <p class="text-emerald-700">{{ format(row.sku.price) }}</p>
          <div class="flex items-center gap-2 mt-2">
            <button class="border px-2 rounded" @click="changeQty(row, -1)">-</button>
            <span>{{ row.quantity }}</span>
            <button class="border px-2 rounded" @click="changeQty(row, 1)">+</button>
          </div>
          <p v-if="!row.valid" class="text-red-500 text-xs mt-1">{{ row.invalidReason }}</p>
        </div>
        <button class="text-red-500 text-sm" @click="remove(row.id)">删除</button>
      </li>
    </ul>
    <div v-if="items.length" class="mt-4 flex justify-between items-center">
      <p class="font-medium">合计：{{ format(total) }}</p>
      <NuxtLink to="/checkout" class="bg-emerald-600 text-white px-6 py-2 rounded-lg">去结算</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { format } = usePrice();
const api = useApi();

interface CartRow {
  id: number;
  quantity: number;
  selected: boolean;
  valid: boolean;
  invalidReason?: string;
  sku: { spuTitle: string; mainImage: string; specs: Record<string, string>; price: number };
}

const items = ref<CartRow[]>([]);

const total = computed(() =>
  items.value.filter((i) => i.selected && i.valid).reduce((s, i) => s + i.sku.price * i.quantity, 0),
);

function specText(specs: Record<string, string>) {
  return Object.entries(specs).map(([k, v]) => `${k}:${v}`).join(' ');
}

async function load() {
  items.value = await api<CartRow[]>('/cart');
}

async function toggle(row: CartRow) {
  await api(`/cart/items/${row.id}`, { method: 'PUT', body: { selected: row.selected } });
}

async function changeQty(row: CartRow, delta: number) {
  const qty = Math.max(1, row.quantity + delta);
  await api(`/cart/items/${row.id}`, { method: 'PUT', body: { quantity: qty } });
  row.quantity = qty;
}

async function remove(id: number) {
  await api(`/cart/items/${id}`, { method: 'DELETE' });
  await load();
  useCartStore().fetchCart();
}

onMounted(load);
</script>
