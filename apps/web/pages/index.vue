<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">欢迎来到 SimpleMall</h1>
    <p class="text-gray-600 mb-6">轻量电商演示 — 浏览商品、购物车、模拟支付</p>
    <div v-if="categories.length" class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 mb-2">商品分类</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="c in categories"
          :key="c.id"
          :to="`/categories/${c.id}`"
          class="px-3 py-1 bg-white rounded-full shadow text-sm hover:bg-emerald-50"
        >
          {{ c.name }}
        </NuxtLink>
      </div>
    </div>
    <NuxtLink
      to="/products"
      class="inline-block bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
    >
      进入商品列表
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const api = useApi();
const { data } = await useAsyncData('home-cat', () =>
  api<Array<{ id: number; name: string; children?: unknown[] }>>('/categories/tree'),
);
const categories = computed(() => data.value ?? []);
</script>
