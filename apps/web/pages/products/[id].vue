<template>
  <div v-if="spu" class="bg-white rounded-xl shadow p-6 md:flex gap-6">
    <img :src="spu.mainImage" class="w-full md:w-80 aspect-square object-cover rounded-lg" alt="" />
    <div class="flex-1">
      <h1 class="text-xl font-semibold">{{ spu.title }}</h1>
      <p class="text-2xl text-emerald-700 mt-2">{{ format(currentSku?.price ?? 0) }}</p>
      <p class="text-sm text-gray-500 mt-1">库存：{{ currentSku?.stock ?? 0 }}</p>
      <div v-for="(values, name) in specMap" :key="name" class="mt-4">
        <p class="text-sm text-gray-600 mb-2">{{ name }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="v in values"
            :key="v"
            class="px-3 py-1 border rounded text-sm"
            :class="selectedSpecs[name] === v ? 'border-emerald-600 bg-emerald-50' : ''"
            @click="selectedSpecs[name] = v"
          >
            {{ v }}
          </button>
        </div>
      </div>
      <div class="mt-6 flex gap-3">
        <button
          class="bg-emerald-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          :disabled="!currentSku || currentSku.stock < 1"
          @click="addCart"
        >
          加入购物车
        </button>
        <button
          class="border border-emerald-600 text-emerald-700 px-6 py-2 rounded-lg disabled:opacity-50"
          :disabled="!currentSku || currentSku.stock < 1"
          @click="buyNow"
        >
          立即购买
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { format } = usePrice();
const api = useApi();
const cart = useCartStore();
const auth = useAuthStore();
if (import.meta.client) auth.hydrate();

interface Sku {
  id: number;
  specs: Record<string, string>;
  price: number;
  stock: number;
}

const { data: spu } = await useAsyncData(`spu-${route.params.id}`, () =>
  api<{ id: number; title: string; mainImage: string; skus: Sku[] }>(`/spus/${route.params.id}`),
);

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

async function addCart() {
  if (!currentSku.value) return;
  if (!auth.accessToken) {
    navigateTo('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  await cart.add(currentSku.value.id, 1);
  alert('已加入购物车');
}

function buyNow() {
  if (!currentSku.value) return;
  if (!auth.accessToken) {
    navigateTo('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  navigateTo(`/checkout?skuId=${currentSku.value.id}&qty=1&buyNow=1`);
}
</script>
