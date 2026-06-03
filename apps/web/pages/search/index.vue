<template>
  <div class="search-page">
    <h1 class="search-page__title">搜索结果</h1>
    <p v-if="searchLabel" class="search-page__hint">
      {{ searchLabel }}
    </p>
    <div v-if="pending" class="text-gray-500 py-12 text-center">加载中…</div>
    <div v-else-if="!list.length" class="text-gray-500 py-12 text-center">暂无相关商品，换个关键词试试</div>
    <div v-else class="search-page__grid">
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

const searchLabel = computed(() => {
  if (!q.value) return '';
  return `正在搜索「${q.value}」`;
});

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

<style scoped>
.search-page__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.search-page__hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.search-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 1024px) {
  .search-page__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .search-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 375px) {
  .search-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
