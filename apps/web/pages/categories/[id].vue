<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">分类商品</h1>
    <div class="grid grid-cols-4 gap-4 bp-1024:grid-cols-3 bp-768:grid-cols-2 bp-375:grid-cols-1">
      <NuxtLink
        v-for="item in list"
        :key="item.id"
        :to="`/products/${item.id}`"
        class="bg-white rounded-lg overflow-hidden shadow"
      >
        <img :src="item.mainImage" class="w-full aspect-square object-cover" alt="" />
        <div class="p-3">
          <p class="line-clamp-2 text-sm">{{ item.title }}</p>
          <p class="text-emerald-700 font-medium mt-1">{{ format(item.minPrice) }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { format } = usePrice();
const api = useApi();

const { data } = await useAsyncData(`cat-${route.params.id}`, () =>
  api<{ list: Array<{ id: number; title: string; mainImage: string; minPrice: number }> }>('/spus', {
    query: { categoryId: route.params.id },
  }),
);

const list = computed(() => data.value?.list ?? []);
</script>
