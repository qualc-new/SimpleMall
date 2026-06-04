<template>
  <div class="max-w-lg">
    <h1 class="text-xl font-semibold mb-4">确认订单</h1>
    <NuxtLink to="/user/addresses" class="text-sm text-emerald-600 mb-2 inline-block">管理地址</NuxtLink>
    <div v-if="address" class="bg-white p-4 rounded-lg shadow mb-4 text-sm border-2 border-emerald-500">
      <p class="font-medium">{{ address.name }} {{ address.phone }}</p>
      <p class="text-gray-600">
        {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
      </p>
    </div>
    <p v-else class="text-red-500 text-sm mb-4">
      暂无地址，请先 <NuxtLink to="/user/addresses" class="underline">添加收货地址</NuxtLink>
    </p>
    <ul class="bg-white rounded-lg shadow divide-y mb-4 text-sm">
      <li v-for="row in lines" :key="row.id" class="p-3 flex justify-between">
        <span>{{ row.sku.spuTitle }} × {{ row.quantity }}</span>
        <span>{{ format(row.sku.price * row.quantity) }}</span>
      </li>
    </ul>
    <p class="font-medium mb-4">应付：{{ format(total) }}</p>
    <button
      class="w-full bg-emerald-600 text-white py-2 rounded-lg disabled:opacity-50"
      :disabled="submitting || !address || !lines.length"
      @click="submit"
    >
      {{ submitting ? '提交中…' : '提交订单并支付' }}
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { format } = usePrice();
const api = useApi();
const route = useRoute();
const submitting = ref(false);
const address = ref<{ id: number; name: string; phone: string; province: string; city: string; district: string; detail: string } | null>(null);
const lines = ref<Array<{ id: number; quantity: number; sku: { spuTitle: string; price: number } }>>([]);

const total = computed(() => lines.value.reduce((s, r) => s + r.sku.price * r.quantity, 0));

onMounted(async () => {
  const addrs = await api<typeof address.value[]>('/addresses');
  address.value = addrs.find((a) => a?.isDefault) ?? addrs[0] ?? null;

  if (route.query.buyNow && route.query.skuId) {
    const title = typeof route.query.title === 'string' ? route.query.title : '';
    const price = Number(route.query.price) || 0;
    const qty = Number(route.query.qty) || 1;
    lines.value = [{
      id: 0,
      quantity: qty,
      sku: { spuTitle: title, price },
    }];
    return;
  }

  const cart = await api<Array<{ id: number; quantity: number; selected: boolean; valid: boolean; sku: { spuTitle: string; price: number } }>>('/cart');
  lines.value = cart.filter((c) => c.selected && c.valid);
});

async function submit() {
  if (!address.value) return;
  submitting.value = true;
  try {
    let order: { id: number };
    if (route.query.skuId && route.query.qty) {
      order = await api('/orders', {
        method: 'POST',
        body: {
          addressId: address.value.id,
          directBuy: { skuId: Number(route.query.skuId), quantity: Number(route.query.qty) },
        },
      });
    } else {
      order = await api('/orders', {
        method: 'POST',
        body: { addressId: address.value.id, cartItemIds: lines.value.map((l) => l.id) },
      });
    }
    const pay = await api<{ payUrl: string }>('/payments', {
      method: 'POST',
      body: { orderId: order.id, channel: 'ALIPAY' },
    });
    window.location.href = pay.payUrl;
  } finally {
    submitting.value = false;
  }
}
</script>
