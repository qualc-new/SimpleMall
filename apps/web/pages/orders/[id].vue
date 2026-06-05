<template>
  <div v-if="order" class="space-y-5">
    <!-- 订单头 -->
    <div class="bg-white p-6 rounded-xl shadow space-y-3">
      <div class="flex justify-between items-start flex-wrap gap-2">
        <h1 class="text-xl font-semibold">订单 {{ order.orderNo }}</h1>
        <span class="text-sm px-3 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
          {{ statusLabel(order.status) }}
        </span>
      </div>
      <!-- 金额汇总 -->
      <div class="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-gray-500">
        <span>商品总额 <b class="text-gray-900">{{ format(order.totalAmount) }}</b></span>
        <span>运费 <b class="text-gray-900">{{ freightText }}</b></span>
        <span class="text-base">
          实付 <b class="text-emerald-700 text-xl">{{ format(order.payAmount) }}</b>
        </span>
      </div>
    </div>

    <!-- 订单信息：key-value 左右布局 -->
    <div class="bg-white p-6 rounded-xl shadow">
      <h2 class="text-base font-semibold text-gray-900 mb-4">订单信息</h2>
      <dl class="divide-y divide-gray-100 text-sm">
        <div v-if="shippingAddress" class="flex gap-4 py-3 first:pt-0">
          <dt class="text-gray-500 w-20 shrink-0">配送地址</dt>
          <dd class="flex-1 text-gray-900 text-right min-w-0">
            <p class="font-medium">{{ shippingAddress.name }} {{ shippingAddress.phone }}</p>
            <p class="text-gray-600 mt-0.5 break-words">{{ shippingAddress.full }}</p>
          </dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-gray-500 shrink-0">下单时间</dt>
          <dd class="text-gray-900 text-right">{{ formatDateTime(order.createdAt) }}</dd>
        </div>
        <div
          v-if="order.updatedAt && order.updatedAt !== order.createdAt"
          class="flex justify-between gap-4 py-3"
        >
          <dt class="text-gray-500 shrink-0">更新时间</dt>
          <dd class="text-gray-900 text-right">{{ formatDateTime(order.updatedAt) }}</dd>
        </div>
        <div v-if="order.payment" class="flex justify-between gap-4 py-3">
          <dt class="text-gray-500 shrink-0">支付方式</dt>
          <dd class="text-gray-900 text-right">{{ payChannelLabel(order.payment.channel) }}</dd>
        </div>
        <div v-if="order.payment?.paidAt" class="flex justify-between gap-4 py-3">
          <dt class="text-gray-500 shrink-0">支付时间</dt>
          <dd class="text-gray-900 text-right">{{ formatDateTime(order.payment.paidAt) }}</dd>
        </div>
        <div v-if="order.remark" class="flex gap-4 py-3">
          <dt class="text-gray-500 w-20 shrink-0">买家留言</dt>
          <dd class="flex-1 text-gray-900 text-right break-words">{{ order.remark }}</dd>
        </div>
        <template v-if="logistics">
          <div class="flex justify-between gap-4 py-3">
            <dt class="text-gray-500 shrink-0">物流公司</dt>
            <dd class="text-gray-900 text-right">{{ logistics.company }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-3 last:pb-0">
            <dt class="text-gray-500 shrink-0">快递单号</dt>
            <dd class="text-gray-900 text-right break-all">{{ logistics.trackingNo }}</dd>
          </div>
        </template>
      </dl>
    </div>

    <!-- 商品列表 -->
    <div class="bg-white p-6 rounded-xl shadow">
      <h2 class="text-base font-semibold text-gray-900 mb-4">商品信息</h2>
      <ul class="divide-y divide-gray-100">
        <li v-for="(item, idx) in order.items" :key="item.id" class="py-4 first:pt-0 last:pb-0">
          <div class="flex gap-4">
            <!-- 商品图片（可点击预览） -->
            <div class="relative shrink-0">
              <img
                :src="item.spuImage"
                class="w-24 h-24 object-cover rounded-lg cursor-pointer border border-gray-100"
                alt=""
                @click="openGallery(idx)"
              />
              <button
                v-if="(item.spuImages?.length ?? 0) > 0"
                class="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded"
                @click.stop="openGallery(idx)"
              >
                {{ (item.spuImages?.length ?? 0) + 1 }}图
              </button>
            </div>
            <!-- 商品信息 -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 line-clamp-2">{{ item.spuTitle }}</p>
              <!-- 规格 -->
              <p class="text-xs text-gray-500 mt-1">{{ specText(item.specsJson) }}</p>
              <!-- 服务保障标签 -->
              <div v-if="parseServiceList(item.spuServiceList).length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="s in parseServiceList(item.spuServiceList)"
                  :key="s"
                  class="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded"
                >{{ s }}</span>
              </div>
            </div>
            <!-- 价格与数量 -->
            <div class="shrink-0 text-right">
              <p class="text-base font-semibold text-gray-900">{{ format(item.unitPrice) }}</p>
              <p v-if="showMarketPrice(item)" class="text-xs text-gray-400 line-through">{{ format(item.spuMarketPrice) }}</p>
              <p class="text-sm text-gray-400 mt-1">× {{ item.quantity }}</p>
            </div>
          </div>
        </li>
      </ul>
      <!-- 运费 + 优惠合计 -->
      <div class="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">商品小计</span>
          <span class="text-gray-900">{{ format(itemsTotal) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">运费</span>
          <span class="text-gray-900">{{ freightText }}</span>
        </div>
        <div v-if="discountAmount > 0" class="flex justify-between">
          <span class="text-gray-500">优惠</span>
          <span class="text-emerald-600">-{{ format(discountAmount) }}</span>
        </div>
        <div class="flex justify-between pt-1.5 border-t border-gray-100 text-base font-semibold">
          <span>实付</span>
          <span class="text-emerald-700">{{ format(order.payAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- 订单轨迹 -->
    <div v-if="order.statusLogs?.length" class="bg-white p-6 rounded-xl shadow">
      <h2 class="text-base font-semibold text-gray-900 mb-4">订单轨迹</h2>
      <div class="relative pl-8">
        <div
          class="absolute left-[6.5px] top-1.5 bottom-0 w-px bg-gray-200"
          aria-hidden="true"
        />
        <div
          v-for="(log, idx) in reversedLogs"
          :key="log.id"
          class="relative pb-6 last:pb-0"
          :class="{ 'opacity-50': idx < reversedLogs.length - 1 }"
        >
          <div
            class="absolute left-[-2rem] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white z-10"
            :class="
              idx === 0
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-300'
            "
            aria-hidden="true"
          />
          <p class="text-xs text-gray-400 mb-0.5">{{ formatLogDate(log.createdAt) }}</p>
          <p class="text-sm font-medium" :class="idx === 0 ? 'text-gray-900' : 'text-gray-500'">
            {{ statusLabel(log.toStatus) }}
          </p>
          <p v-if="log.remark" class="text-xs text-gray-400 mt-0.5">{{ log.remark }}</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-2">
      <button v-if="order.status === 'PENDING_PAY'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="pay">去支付</button>
      <button v-if="order.status === 'PENDING_PAY'" class="border px-4 py-2 rounded" @click="cancel">取消订单</button>
      <button v-if="order.status === 'SHIPPED'" class="bg-emerald-600 text-white px-4 py-2 rounded" @click="complete">确认收货</button>
      <button v-if="['PAID','SHIPPED'].includes(order.status)" class="border px-4 py-2 rounded" @click="openRefund">申请退货</button>
    </div>

    <ImagePreviewCarousel
      v-model="galleryOpen"
      :images="galleryImages"
      :initial-index="galleryInitialIndex"
    />

    <!-- 退货弹窗 -->
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

interface OrderItem {
  id: number;
  spuTitle: string;
  specsJson: Record<string, string>;
  unitPrice: number;
  quantity: number;
  spuImage: string;
  spuImages: string[];
  spuMarketPrice: number;
  spuFreightType: number;
  spuServiceList: string;
}

/** 下单时收货地址快照 */
interface OrderAddressSnapshot {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

type OrderRow = {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  payAmount: number;
  remark?: string | null;
  addressJson: OrderAddressSnapshot;
  createdAt: string;
  updatedAt: string;
  logisticsJson?: { company: string; trackingNo: string };
  payment?: { channel: string; paidAt?: string | null } | null;
  items: OrderItem[];
  statusLogs?: Array<{ id: number; toStatus: string; createdAt: string; remark?: string | null }>;
};

const order = ref<OrderRow | null>(null);

const logistics = computed(() => order.value?.logisticsJson);

/** 配送地址展示（addressJson 为下单快照） */
const shippingAddress = computed(() => {
  const addr = order.value?.addressJson;
  if (!addr?.name) return null;
  return {
    name: addr.name,
    phone: addr.phone,
    full: `${addr.province}${addr.city}${addr.district}${addr.detail}`,
  };
});

/** 运费文本 */
const freightText = computed(() => {
  if (!order.value?.items.length) return '¥0';
  const ft = order.value.items[0].spuFreightType;
  return ft === 1 ? '包邮' : '以结算为准';
});

/** 商品小计 */
const itemsTotal = computed(() =>
  order.value?.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) ?? 0,
);

/** 优惠金额（商品总额 + 未单独算运费，这里按划线价差值展示） */
const discountAmount = computed(() => {
  if (!order.value) return 0;
  const marketTotal = order.value.items.reduce(
    (s, i) => s + (i.spuMarketPrice > 0 ? i.spuMarketPrice : i.unitPrice) * i.quantity,
    0,
  );
  return Math.max(0, marketTotal - itemsTotal.value);
});

/** 轨迹倒序，最新在最上 */
const reversedLogs = computed(() =>
  order.value?.statusLogs ? [...order.value.statusLogs].reverse() : [],
);

const refundOpen = ref(false);
const refundReason = ref('');
const refundSubmitting = ref(false);

/** 图片预览 */
const galleryOpen = ref(false);
const galleryInitialIndex = ref(0);
const galleryImages = ref<string[]>([]);

function openGallery(itemIdx: number) {
  if (!order.value) return;
  const item = order.value.items[itemIdx];
  const imgs = [item.spuImage, ...(item.spuImages ?? []).filter(Boolean)];
  galleryImages.value = imgs;
  galleryInitialIndex.value = 0;
  galleryOpen.value = true;
}

function specText(specs: Record<string, string>) {
  return Object.entries(specs ?? {}).map(([k, v]) => `${k}:${v}`).join(' / ');
}

function parseServiceList(raw: string): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function showMarketPrice(item: OrderItem) {
  return item.spuMarketPrice > 0 && item.spuMarketPrice > item.unitPrice;
}

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}

function formatLogDate(v: string) {
  const d = new Date(v);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function formatDateTime(v: string) {
  const d = new Date(v);
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mm}-${dd} ${hh}:${mi}`;
}

function payChannelLabel(channel: string) {
  return channel === 'ALIPAY' ? '支付宝' : channel === 'WECHAT' ? '微信支付' : channel;
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
