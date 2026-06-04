<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">我的订单</h1>
    <div v-if="!list.length" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg class="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p class="text-base">暂无订单</p>
      <NuxtLink to="/" class="mt-4 text-sm text-emerald-600 underline">去逛逛</NuxtLink>
    </div>
    <ul v-else class="space-y-3">
      <li v-for="o in list" :key="o.id" class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between text-sm">
          <span>{{ o.orderNo }}</span>
          <span>{{ statusLabel(o.status) }}</span>
        </div>
        <p class="text-emerald-700 mt-1">{{ format(o.payAmount) }}</p>
        <NuxtLink :to="`/orders/${o.id}`" class="text-sm text-emerald-600 mt-2 inline-block">查看详情</NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';

definePageMeta({ middleware: 'auth' });

const { format } = usePrice();
const api = useApi();

const list = ref<Array<{ id: number; orderNo: string; status: string; payAmount: number }>>([]);

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}

onMounted(async () => {
  const res = await api<{ list: typeof list.value }>('/orders');
  list.value = res.list;
});
</script>
