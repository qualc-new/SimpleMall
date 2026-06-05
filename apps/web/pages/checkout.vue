<template>
  <div class="max-w-2xl pb-24">
    <h1 class="text-xl font-semibold mb-4">确认订单</h1>

    <!-- 收货地址：点击进入选择页，返回后回显 -->
    <button
      type="button"
      class="w-full bg-white p-4 rounded-xl shadow mb-4 text-left transition-colors hover:bg-gray-50"
      @click="goPickAddress"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-500">配送地址</span>
        <span class="text-gray-400 text-lg leading-none" aria-hidden="true">›</span>
      </div>
      <template v-if="address">
        <p class="font-medium text-gray-900">{{ address.name }} {{ address.phone }}</p>
        <p class="text-sm text-gray-600 mt-1">
          {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
        </p>
      </template>
      <p v-else class="text-emerald-600 text-sm">请选择收货地址</p>
    </button>

    <!-- 商品信息（样式对齐订单详情） -->
    <div class="bg-white p-6 rounded-xl shadow mb-4">
      <h2 class="text-base font-semibold text-gray-900 mb-4">商品信息</h2>
      <ul v-if="lines.length" class="divide-y divide-gray-100">
        <li v-for="(row, idx) in lines" :key="row.id" class="py-4 first:pt-0 last:pb-0">
          <div class="flex gap-4">
            <!-- 商品图片（可点击预览轮播） -->
            <div class="relative shrink-0">
              <img
                v-if="row.sku.mainImage"
                :src="row.sku.mainImage"
                class="w-24 h-24 object-cover rounded-lg cursor-pointer border border-gray-100"
                alt=""
                @click="openGallery(idx)"
              />
              <div
                v-else
                class="w-24 h-24 rounded-lg bg-gray-100 border border-gray-100"
              />
              <button
                v-if="lineImageCount(row) > 1"
                type="button"
                class="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded"
                @click.stop="openGallery(idx)"
              >
                {{ lineImageCount(row) }}图
              </button>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 line-clamp-2">{{ row.sku.spuTitle }}</p>
              <p v-if="specText(row.sku.specs)" class="text-xs text-gray-500 mt-1">
                {{ specText(row.sku.specs) }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-base font-semibold text-gray-900">{{ format(row.sku.price) }}</p>
              <p class="text-sm text-gray-400 mt-1">× {{ row.quantity }}</p>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">暂无商品，请返回购物车选择</p>
    </div>

    <!-- 金额汇总 -->
    <div class="bg-white p-4 rounded-xl shadow text-sm space-y-2 mb-4">
      <div class="flex justify-between text-gray-600">
        <span>商品合计</span>
        <span>{{ format(total) }}</span>
      </div>
      <div class="flex justify-between font-semibold text-gray-900 text-base pt-2 border-t border-gray-100">
        <span>应付金额</span>
        <span class="text-emerald-700">{{ format(total) }}</span>
      </div>
    </div>

    <button
      class="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
      :disabled="submitting || !address || !lines.length"
      @click="submit"
    >
      {{ submitting ? '提交中…' : '提交订单并支付' }}
    </button>

    <ImagePreviewCarousel
      v-model="galleryOpen"
      :images="galleryImages"
      :initial-index="galleryInitialIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { loadPickedAddress, type PickedAddress } from '../composables/useAddressPick';

definePageMeta({ middleware: 'auth' });

const { format } = usePrice();
const api = useApi();
const route = useRoute();
const submitting = ref(false);

type AddressRow = PickedAddress & {
  name: string;
  phone: string;
  detail: string;
};

interface CheckoutLine {
  id: number;
  quantity: number;
  sku: {
    spuTitle: string;
    price: number;
    mainImage?: string;
    spuImages?: string[];
    specs?: Record<string, string>;
  };
}

const address = ref<AddressRow | null>(null);
const lines = ref<CheckoutLine[]>([]);

const total = computed(() => lines.value.reduce((s, r) => s + r.sku.price * r.quantity, 0));

/** 图片预览轮播 */
const galleryOpen = ref(false);
const galleryInitialIndex = ref(0);
const galleryImages = ref<string[]>([]);

function specText(specs: Record<string, string> | undefined) {
  if (!specs) return '';
  return Object.entries(specs)
    .map(([k, v]) => `${k}:${v}`)
    .join(' / ');
}

/** 合并主图与图册，去重 */
function lineImages(row: CheckoutLine): string[] {
  const main = row.sku.mainImage;
  const extra = (row.sku.spuImages ?? []).filter(Boolean);
  if (!main) return extra;
  return [main, ...extra.filter((url) => url !== main)];
}

function lineImageCount(row: CheckoutLine) {
  return lineImages(row).length;
}

function openGallery(itemIdx: number) {
  const imgs = lineImages(lines.value[itemIdx]);
  if (!imgs.length) return;
  galleryImages.value = imgs;
  galleryInitialIndex.value = 0;
  galleryOpen.value = true;
}

/** 优先使用地址选择页回传的地址，否则取默认地址 */
async function loadAddress() {
  const addrs = await api<AddressRow[]>('/addresses');
  const picked = loadPickedAddress();
  if (picked?.id) {
    const found = addrs.find((a) => a.id === picked.id);
    address.value = found ?? (picked as AddressRow);
    return;
  }
  address.value = addrs.find((a) => a.isDefault) ?? addrs[0] ?? null;
}

function parseJsonFromQuery(raw: unknown): Record<string, string> | string[] | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Record<string, string> | string[];
  } catch {
    return undefined;
  }
}

async function loadLines() {
  if (route.query.buyNow && route.query.skuId) {
    const title =
      typeof route.query.title === 'string' ? decodeURIComponent(route.query.title) : '';
    const price = Number(route.query.price) || 0;
    const qty = Number(route.query.qty) || 1;
    const image =
      typeof route.query.image === 'string' ? decodeURIComponent(route.query.image) : undefined;
    const specs = parseJsonFromQuery(route.query.specs) as Record<string, string> | undefined;
    const spuImages = (parseJsonFromQuery(route.query.images) as string[] | undefined) ?? [];
    lines.value = [
      {
        id: 0,
        quantity: qty,
        sku: { spuTitle: title, price, mainImage: image, spuImages, specs },
      },
    ];
    return;
  }

  const cart = await api<
    Array<{
      id: number;
      quantity: number;
      selected: boolean;
      valid: boolean;
      sku: {
        spuTitle: string;
        price: number;
        mainImage: string;
        spuImages?: string[];
        specs: Record<string, string>;
      };
    }>
  >('/cart');
  lines.value = cart.filter((c) => c.selected && c.valid);
}

function goPickAddress() {
  navigateTo({
    path: '/user/addresses',
    query: { pick: '1', from: route.fullPath },
  });
}

async function init() {
  await Promise.all([loadAddress(), loadLines()]);
}

onMounted(init);

/** 从地址选择页后退返回时重新回显 */
onActivated(() => {
  loadAddress();
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
