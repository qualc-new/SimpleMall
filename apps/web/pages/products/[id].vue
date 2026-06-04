<template>
  <div v-if="spu" class="w-full">
    <div
      class="grid grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] gap-6 items-start bp-1280:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1.1fr)] bp-1024:grid-cols-1"
    >
      <div class="flex flex-col gap-4 min-w-0">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <ProductImageCarousel :main-image="spu.mainImage" :images="spu.images" />
        </div>

        <section v-if="spu.description" class="bg-white rounded-xl shadow-sm p-6 bp-1024:order-3">
          <h2 class="text-lg font-semibold mb-4">商品详情</h2>
          <div
            class="prose prose-sm max-w-none text-gray-700 prose-img:max-w-full prose-img:h-auto"
            v-html="spu.description"
          />
        </section>
      </div>

      <aside
        class="sticky top-[5.5rem] z-10 flex flex-col min-w-0 max-h-[calc(100vh-6.5rem)] bg-white rounded-xl shadow-sm overflow-hidden bp-1024:static bp-1024:max-h-none bp-1024:z-auto bp-1024:order-2 bp-1024:mb-[4.5rem] bp-1024:overflow-visible"
      >
        <div class="flex-1 min-h-0 w-full overflow-y-auto p-5 pb-3 bp-1024:overflow-visible">
          <h1 class="text-lg font-semibold leading-snug">{{ spu.title }}</h1>
          <span
            v-if="spu.status"
            class="inline-block mt-2 text-xs px-2 py-0.5 rounded"
            :class="badgeClass(spu.status)"
          >
            {{ statusLabel(spu.status) }}
          </span>
          <p v-if="spu.subtitle" class="mt-2 text-sm text-gray-500 leading-relaxed">{{ spu.subtitle }}</p>

          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-2 mt-3">
            <span class="text-[1.75rem] font-semibold text-orange-600 leading-tight">
              {{ format(currentSku?.price ?? 0) }}
            </span>
            <span v-if="showMarketPrice" class="text-sm text-gray-400 line-through">
              {{ format(spu.marketPrice) }}
            </span>
            <span
              v-if="discountYuan > 0"
              class="text-[0.8125rem] text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded"
            >
              优惠 {{ discountYuan }} 元
            </span>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-[0.8125rem] text-gray-400 mb-2">配送</p>
            <div class="text-sm text-gray-700 leading-relaxed">
              <p>{{ expressSummary }}</p>
              <p class="mt-1.5 text-emerald-600">
                <button
                  v-if="!auth.accessToken"
                  type="button"
                  class="text-emerald-600 underline underline-offset-2 decoration-dotted cursor-pointer bg-transparent border-0 p-0 inline align-baseline"
                  @click="requireLogin()"
                >
                  登录后查看送达地址
                </button>
                <button
                  v-else
                  type="button"
                  class="text-emerald-600 underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0 inline align-baseline text-left"
                  @click="goPickAddress"
                >
                  当前地址 至 {{ destLabel || '请选择收货地址' }}
                </button>
              </p>
            </div>
          </div>

          <div v-if="serviceTags.length" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-[0.8125rem] text-gray-400 mb-2">服务保障</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in serviceTags"
                :key="tag"
                class="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div v-for="(values, name) in specMap" :key="name" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500 mb-2">{{ name }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="v in values"
                :key="v"
                type="button"
                class="px-3 py-1.5 text-sm border rounded-md transition-colors"
                :class="specBtnClass(name, v)"
                :disabled="!isSpecOptionEnabled(name, v)"
                @click="selectSpec(name, v)"
              >
                {{ v }}
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500 mb-2">数量</p>
            <div class="inline-flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                type="button"
                class="w-9 h-9 border-0 bg-gray-50 text-gray-700 text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity <= 1"
                aria-label="减少"
                @click="changeQty(-1)"
              >
                −
              </button>
              <input
                v-model.number="quantity"
                type="number"
                class="w-12 h-9 border-0 border-x border-gray-200 text-center text-sm"
                :min="1"
                :max="maxQty"
                @blur="clampQty"
              />
              <button
                type="button"
                class="w-9 h-9 border-0 bg-gray-50 text-gray-700 text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity >= maxQty"
                aria-label="增加"
                @click="changeQty(1)"
              >
                +
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">库存 {{ currentSku?.stock ?? 0 }} 件</p>
          </div>

          <p v-if="buyHint" class="text-sm text-amber-700 mt-3">{{ buyHint }}</p>
        </div>

        <div
          class="shrink-0 flex items-center gap-3 px-4 pt-3 pb-4 bg-white border-t border-gray-100 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] bp-1024:fixed bp-1024:inset-x-0 bp-1024:bottom-0 bp-1024:z-[25] bp-1024:border-gray-200 bp-1024:shadow-[0_-4px_20px_rgba(0,0,0,0.1)] bp-1024:py-2.5 bp-1024:px-4 bp-1024:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]"
        >
          <div
            class="flex flex-1 items-stretch h-12 min-w-0 rounded-full overflow-hidden"
            :class="{ 'opacity-55': !canBuy }"
          >
            <button
              type="button"
              class="flex-[0_0_26%] flex items-center justify-center border-0 text-white bg-gradient-to-r from-yellow-300 via-amber-500 to-orange-600 disabled:cursor-not-allowed"
              :disabled="!canBuy"
              aria-label="加入购物车"
              @click="addCart"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6h15l-1.5 9H8L6 6z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
                <path d="M6 6L5 3H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                <path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              class="flex-1 border-0 text-base font-semibold tracking-wide text-white bg-[#ff5000] disabled:cursor-not-allowed"
              :disabled="!canBuy"
              @click="buyNow"
            >
              立即购买
            </button>
          </div>
          <button
            type="button"
            class="shrink-0 flex flex-col items-center justify-center gap-0.5 w-11 p-0 border-0 bg-transparent cursor-pointer"
            :class="isFavorited ? 'text-amber-500' : 'text-gray-900'"
            aria-label="收藏"
            @click="toggleFavorite"
          >
            <svg class="w-[1.375rem] h-[1.375rem]" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3.5l2.09 4.24 4.68.68-3.39 3.3.8 4.66L12 14.77l-4.18 2.2.8-4.66-3.39-3.3 4.68-.68L12 3.5z"
                :fill="isFavorited ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
            </svg>
            <span class="text-[0.6875rem] leading-none">收藏</span>
          </button>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { normalizeSpuStatus, SPU_PURCHASABLE } from '@simplemall/shared';
import { loadPickedAddress } from '../../composables/useAddressPick';

const route = useRoute();
const { format } = usePrice();
const { label: statusLabel, badgeClass, canPurchase, purchaseHint } = useSpuStatus();
const api = useApi();
const cart = useCartStore();
const auth = useAuthStore();
const { requireLogin } = useRequireLogin();
const { toast } = useToast();
if (import.meta.client) auth.hydrate();

interface Sku {
  id: number;
  specs: Record<string, string>;
  price: number;
  stock: number;
}

interface ExpressTemplate {
  id: number;
  name: string;
  firstFee: number;
  continueFee: number;
  remark: string;
}

interface SpuDetail {
  id: number;
  title: string;
  subtitle?: string;
  mainImage: string;
  images: string[];
  status: string;
  description?: string;
  marketPrice: number;
  freightType: number;
  limitBuy: number;
  shipFrom?: string;
  express: ExpressTemplate | null;
  serviceGuarantees: string[];
  skus: Sku[];
}

type AddressRow = {
  id: number;
  province: string;
  city: string;
  district: string;
  isDefault: boolean;
};

const { data: spu } = await useAsyncData(`spu-${route.params.id}`, () =>
  api<SpuDetail>(`/spus/${route.params.id}`),
);

const serviceTags = computed(() => spu.value?.serviceGuarantees ?? []);

const defaultAddress = ref<AddressRow | null>(null);
const quantity = ref(1);
const isFavorited = ref(false);

function toggleFavorite() {
  if (!requireLogin()) return;
  isFavorited.value = !isFavorited.value;
}

const selectedSpecs = reactive<Record<string, string>>({});

const specMap = computed(() => {
  const map: Record<string, Set<string>> = {};
  for (const sku of spu.value?.skus ?? []) {
    for (const [k, v] of Object.entries(sku.specs)) {
      if (!map[k]) map[k] = new Set();
      map[k].add(v);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(map)) out[k] = [...set];
  return out;
});

watch(
  specMap,
  (m) => {
    for (const [k, vals] of Object.entries(m)) {
      if (!selectedSpecs[k] && vals[0]) selectedSpecs[k] = vals[0];
    }
  },
  { immediate: true },
);

const currentSku = computed(() =>
  spu.value?.skus.find((s) =>
    Object.entries(selectedSpecs).every(([k, v]) => s.specs[k] === v),
  ),
);

watch(currentSku, () => {
  quantity.value = 1;
});

const maxQty = computed(() => {
  const stock = currentSku.value?.stock ?? 0;
  if (stock <= 0) return 1;
  const limit = spu.value?.limitBuy && spu.value.limitBuy > 0 ? spu.value.limitBuy : 99;
  return Math.min(stock, limit, 99);
});

const showMarketPrice = computed(() => {
  const mp = spu.value?.marketPrice ?? 0;
  const price = currentSku.value?.price ?? 0;
  return mp > price;
});

const discountYuan = computed(() => {
  if (!showMarketPrice.value || !currentSku.value) return 0;
  const diff = (spu.value!.marketPrice - currentSku.value.price) / 100;
  return diff >= 0.01 ? diff.toFixed(2).replace(/\.?0+$/, '') : 0;
});

const expressSummary = computed(() => {
  if (!spu.value) return '';
  if (spu.value.freightType === 1) return '包邮 · 全场免运费';
  const exp = spu.value.express;
  if (!exp) return '运费以结算为准';
  if (exp.firstFee <= 0 && exp.continueFee <= 0) return `${exp.name} · ${exp.remark || '免运费'}`;
  return `${exp.name} · ${exp.remark || `首件${format(exp.firstFee)}，续件${format(exp.continueFee)}`}`;
});

const destLabel = computed(() => {
  if (!defaultAddress.value) return '';
  const a = defaultAddress.value;
  return `${a.province} ${a.city} ${a.district}`;
});

/** 商品是否仍存在可售 SKU（已上架且有库存） */
const productCanPurchase = computed(() => {
  if (!spu.value) return false;
  if (!SPU_PURCHASABLE.includes(normalizeSpuStatus(spu.value.status))) return false;
  return spu.value.skus.some((s) => s.stock > 0);
});

function isSpecOptionEnabled(specName: string, value: string): boolean {
  if (!spu.value || !productCanPurchase.value) return false;
  return spu.value.skus.some((sku) => {
    if (sku.stock <= 0) return false;
    if (sku.specs[specName] !== value) return false;
    for (const [k, v] of Object.entries(selectedSpecs)) {
      if (k === specName || !v) continue;
      if (sku.specs[k] !== v) return false;
    }
    return true;
  });
}

function specBtnClass(specName: string, value: string): string {
  const enabled = isSpecOptionEnabled(specName, value);
  const selected = selectedSpecs[specName] === value;
  if (!enabled) {
    return 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed';
  }
  if (selected) {
    return 'border-emerald-600 bg-emerald-50 text-emerald-800';
  }
  return 'border-gray-200 bg-white text-gray-700 hover:border-emerald-400';
}

function selectSpec(specName: string, value: string) {
  if (!isSpecOptionEnabled(specName, value)) return;
  selectedSpecs[specName] = value;
}

const canBuy = computed(() =>
  spu.value && currentSku.value
    ? canPurchase(spu.value.status, currentSku.value.stock)
    : false,
);

const buyHint = computed(() =>
  spu.value && currentSku.value
    ? purchaseHint(spu.value.status, currentSku.value.stock)
    : '',
);

function changeQty(delta: number) {
  quantity.value = Math.max(1, Math.min(maxQty.value, quantity.value + delta));
}

function clampQty() {
  if (!Number.isFinite(quantity.value) || quantity.value < 1) quantity.value = 1;
  if (quantity.value > maxQty.value) quantity.value = maxQty.value;
}

function applyPickedOrDefault() {
  const picked = loadPickedAddress();
  if (picked) {
    defaultAddress.value = picked;
    return;
  }
  loadDefaultAddress();
}

async function loadDefaultAddress() {
  if (!auth.accessToken) {
    defaultAddress.value = null;
    return;
  }
  try {
    const addrs = await api<AddressRow[]>('/addresses');
    defaultAddress.value = addrs.find((a) => a.isDefault) ?? addrs[0] ?? null;
  } catch {
    defaultAddress.value = null;
  }
}

function goPickAddress() {
  if (!requireLogin()) return;
  navigateTo({
    path: '/user/addresses',
    query: { pick: '1', from: route.fullPath },
  });
}

onMounted(() => {
  applyPickedOrDefault();
});

onActivated(() => {
  applyPickedOrDefault();
});

watch(
  () => auth.accessToken,
  () => applyPickedOrDefault(),
);

async function addCart() {
  if (!currentSku.value || !canBuy.value) return;
  if (!requireLogin()) return;
  clampQty();
  await cart.add(currentSku.value.id, quantity.value);
  toast('已加入购物车');
}

function buyNow() {
  if (!currentSku.value || !canBuy.value) return;
  if (!requireLogin()) return;
  clampQty();
  const title = encodeURIComponent(spu.value!.title);
  navigateTo(`/checkout?skuId=${currentSku.value.id}&qty=${quantity.value}&buyNow=1&title=${title}&price=${currentSku.value.price}`);
}
</script>

