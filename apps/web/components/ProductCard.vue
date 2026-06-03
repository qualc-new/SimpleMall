<template>
  <NuxtLink
    :to="`/products/${item.id}`"
    class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
  >
    <img :src="item.mainImage" class="w-full aspect-square object-cover" alt="" />
    <div class="p-3">
      <p class="line-clamp-2 text-sm font-medium text-gray-900">{{ item.title }}</p>
      <p v-if="item.subtitle" class="line-clamp-1 text-xs text-gray-500 mt-1">{{ item.subtitle }}</p>
      <div class="flex items-baseline gap-2 mt-2">
        <span class="text-emerald-700 font-semibold">{{ format(item.minPrice) }}</span>
        <span
          v-if="item.marketPrice && item.marketPrice > item.minPrice"
          class="text-xs text-gray-400 line-through"
        >
          {{ format(item.marketPrice) }}
        </span>
      </div>
      <div v-if="item.tagList?.length" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="t in item.tagList.slice(0, 3)"
          :key="t"
          class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
        >
          {{ t }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  item: {
    id: number;
    title: string;
    subtitle?: string;
    mainImage: string;
    minPrice: number;
    marketPrice?: number;
    tagList?: string[];
  };
}>();

const { format } = usePrice();
</script>
