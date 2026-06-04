<template>
  <div>
    <h1 class="text-xl font-semibold mb-1">{{ q ? `搜索「${q}」` : '商品搜索' }}</h1>
    <div v-if="pending" class="text-gray-500 py-12 text-center">加载中…</div>
    <div v-else-if="!list.length" class="text-gray-500 py-12 text-center">暂无相关商品，换个关键词试试</div>
    <div
      v-else
      class="grid grid-cols-4 gap-4 bp-1024:grid-cols-3 bp-768:grid-cols-2 bp-375:grid-cols-1"
    >
      <ProductCard v-for="item in list" :key="item.id" :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const api = useApi();

const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));

const queryParams = computed(() => ({
  pageSize: 24,
  ...(q.value ? { q: q.value } : {}),
}));

const { data, pending } = await useAsyncData(
  () => `search-${q.value}`,
  () =>
    api<{
      list: Array<{
        id: number;
        title: string;
        subtitle?: string;
        mainImage: string;
        minPrice: number;
        marketPrice?: number;
        tagList?: string[];
      }>;
    }>('/spus', { query: queryParams.value }),
  { watch: [q] },
);

const list = computed(() => data.value?.list ?? []);
</script>
