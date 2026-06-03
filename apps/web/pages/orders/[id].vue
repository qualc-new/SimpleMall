<template>
  <div v-if="order" class="bg-white p-6 rounded-xl shadow space-y-4">
    <h1 class="text-xl font-semibold">订单 {{ order.orderNo }}</h1>
    <p>状态：<span class="font-medium">{{ statusLabel(order.status) }}</span></p>
    <p class="text-emerald-700 text-lg">{{ format(order.payAmount) }}</p>
    <div v-if="logistics" class="text-sm bg-gray-50 p-3 rounded">
      <p>物流：{{ logistics.company }}</p>
      <p>单号：{{ logistics.trackingNo }}</p>
    </div>
    <ul class="space-y-2">
      <li v-for="item in order.items" :key="item.id" class="text-sm border-t pt-2">
        {{ item.spuTitle }} × {{ item.quantity }} — {{ format(item.unitPrice * item.quantity) }}
      </li>
    </ul>
    <div v-if="order.statusLogs?.length" class="text-xs text-gray-500">
      <p v-for="log in order.statusLogs" :key="log.id">
        {{ log.createdAt }} → {{ statusLabel(log.toStatus) }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button v-if="order.status === 'PENDING_PAY'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="pay">去支付</button>
      <button v-if="order.status === 'PENDING_PAY'" class="border px-4 py-2 rounded" @click="cancel">取消订单</button>
      <button v-if="order.status === 'SHIPPED'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="complete">确认收货</button>
      <button v-if="['PAID','SHIPPED'].includes(order.status)" class="border px-4 py-2 rounded" @click="refund">申请退货</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { format } = usePrice();
const api = useApi();

const order = ref<{
  id: number;
  orderNo: string;
  status: string;
  payAmount: number;
  logisticsJson?: { company: string; trackingNo: string };
  items: Array<{ id: number; spuTitle: string; quantity: number; unitPrice: number }>;
  statusLogs?: Array<{ id: number; toStatus: string; createdAt: string }>;
} | null>(null);

const logistics = computed(() => order.value?.logisticsJson);

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}

onMounted(load);

async function load() {
  order.value = await api(`/orders/${route.params.id}`);
}

async function pay() {
  if (!order.value) return;
  const res = await api<{ payUrl: string }>('/payments', {
    method: 'POST',
    body: { orderId: order.value.id, channel: 'ALIPAY' },
  });
  window.location.href = res.payUrl;
}

async function cancel() {
  await api(`/orders/${route.params.id}/cancel`, { method: 'POST' });
  await load();
}

async function complete() {
  await api(`/orders/${route.params.id}/complete`, { method: 'POST' });
  await load();
}

async function refund() {
  if (!confirm('确定申请退货？')) return;
  await api(`/orders/${route.params.id}/refund`, { method: 'POST' });
  await load();
}
</script>
