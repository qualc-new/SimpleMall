<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">我的订单</h1>
    <ul class="space-y-3">
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
