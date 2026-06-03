<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">商品列表</h1>
    <div v-if="pending" class="text-gray-500">加载中…</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <NuxtLink
        v-for="item in list"
        :key="item.id"
        :to="`/products/${item.id}`"
        class="bg-white rounded-lg overflow-hidden shadow hover:shadow-md"
      >
        <img :src="item.mainImage" class="w-full aspect-square object-cover" alt="" />
        <div class="p-3">
          <p class="line-clamp-2 text-sm">{{ item.title }}</p>
          <p class="text-emerald-700 font-medium mt-1">{{ format(item.minPrice) }}</p>
          <span
            v-if="item.status && item.status !== 'ON_SALE'"
            class="inline-block mt-2 text-xs px-2 py-0.5 rounded"
            :class="badgeClass(item.status)"
          >
            {{ statusLabel(item.status) }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { format } = usePrice();
const { label: statusLabel, badgeClass } = useSpuStatus();
const api = useApi();

const { data, pending } = await useAsyncData('spus', () =>
  api<{ list: Array<{ id: number; title: string; mainImage: string; minPrice: number; status: string }> }>(
    '/spus',
  ),
);

const list = computed(() => data.value?.list ?? []);
</script>
