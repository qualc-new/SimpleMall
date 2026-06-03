<template>
  <div>
    <h1 class="text-xl font-semibold mb-1">{{ pageTitle }}</h1>
    <p v-if="route.query.keyword || route.query.tag" class="text-sm text-gray-500 mb-4">
      <template v-if="route.query.keyword">关键词：{{ route.query.keyword }}</template>
      <template v-else-if="route.query.tag">标签：{{ route.query.tag }}</template>
    </p>
    <div v-if="pending" class="text-gray-500">加载中…</div>
    <div v-else-if="!list.length" class="text-gray-500 py-12 text-center">暂无相关商品</div>
    <div v-else class="grid grid-cols-3 gap-4 bp-768:grid-cols-2 bp-375:grid-cols-1">
      <ProductCard v-for="item in list" :key="item.id" :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const api = useApi();

const queryParams = computed(() => ({
  pageSize: 24,
  ...(route.query.keyword ? { keyword: String(route.query.keyword) } : {}),
  ...(route.query.tag ? { tag: String(route.query.tag) } : {}),
  ...(route.query.categoryId ? { categoryId: Number(route.query.categoryId) } : {}),
  ...(route.query.recommend ? { recommend: '1' } : {}),
}));

const pageTitle = computed(() => {
  if (route.query.recommend) return '推荐商品';
  if (route.query.tag) return `标签：${route.query.tag}`;
  if (route.query.keyword) return '搜索结果';
  return '商品列表';
});

const { data, pending } = await useAsyncData(
  () => `spus-${JSON.stringify(route.query)}`,
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
  { watch: [() => route.query] },
);

const list = computed(() => data.value?.list ?? []);
</script>
