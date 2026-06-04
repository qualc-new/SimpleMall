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
    <div v-if="order.statusLogs?.length" class="text-xs text-gray-500 space-y-1">
      <p v-for="log in order.statusLogs" :key="log.id">
        {{ formatLogTime(log.createdAt) }} → {{ statusLabel(log.toStatus) }}
        <span v-if="log.remark" class="text-gray-600">（{{ log.remark }}）</span>
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button v-if="order.status === 'PENDING_PAY'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="pay">去支付</button>
      <button v-if="order.status === 'PENDING_PAY'" class="border px-4 py-2 rounded" @click="cancel">取消订单</button>
      <button v-if="order.status === 'SHIPPED'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="complete">确认收货</button>
      <button v-if="['PAID','SHIPPED'].includes(order.status)" class="border px-4 py-2 rounded" @click="openRefund">申请退货</button>
    </div>

    <div
      v-if="refundOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="refundOpen = false"
    >
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="submitRefund">
        <h2 class="text-lg font-semibold">申请退货</h2>
        <textarea
          v-model="refundReason"
          class="w-full border rounded px-3 py-2 min-h-[100px] text-sm"
          placeholder="请填写退货原因（必填）"
          maxlength="255"
          required
        />
        <div class="flex gap-2 justify-end">
          <button type="button" class="border px-4 py-2 rounded" @click="refundOpen = false">取消</button>
          <button type="submit" class="bg-emerald-600 text-white px-4 py-2 rounded" :disabled="refundSubmitting">
            {{ refundSubmitting ? '提交中…' : '提交' }}
          </button>
        </div>
      </form>
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
  statusLogs?: Array<{ id: number; toStatus: string; createdAt: string; remark?: string | null }>;
} | null>(null);

const logistics = computed(() => order.value?.logisticsJson);
const refundOpen = ref(false);
const refundReason = ref('');
const refundSubmitting = ref(false);

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}

function formatLogTime(v: string) {
  return new Date(v).toLocaleString();
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

function openRefund() {
  refundReason.value = '';
  refundOpen.value = true;
}

async function submitRefund() {
  const reason = refundReason.value.trim();
  if (!reason) {
    alert('请填写退货原因');
    return;
  }
  refundSubmitting.value = true;
  try {
    await api(`/orders/${route.params.id}/refund`, { method: 'POST', body: { reason } });
    refundOpen.value = false;
    await load();
  } finally {
    refundSubmitting.value = false;
  }
}
</script>
