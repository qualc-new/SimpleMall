<template>
  <div class="w-full">
    <div class="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
      <div
        class="flex h-full transition-transform duration-300 ease-in-out"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <img
          v-for="(src, i) in slides"
          :key="`${src}-${i}`"
          :src="src"
          class="shrink-0 grow-0 basis-full w-full h-full object-cover"
          :alt="`商品图 ${i + 1}`"
        />
      </div>
      <template v-if="slides.length > 1">
        <button
          type="button"
          class="absolute top-1/2 left-2 z-[2] w-8 h-8 -translate-y-1/2 border-0 rounded-full bg-white/90 text-gray-700 text-xl leading-none cursor-pointer shadow hover:bg-white"
          aria-label="上一张"
          @click="goPrev"
        >
          ‹
        </button>
        <button
          type="button"
          class="absolute top-1/2 right-2 z-[2] w-8 h-8 -translate-y-1/2 border-0 rounded-full bg-white/90 text-gray-700 text-xl leading-none cursor-pointer shadow hover:bg-white"
          aria-label="下一张"
          @click="goNext"
        >
          ›
        </button>
        <span class="absolute right-2 bottom-2 z-[2] px-2 py-0.5 text-xs text-white bg-black/45 rounded-full">
          {{ activeIndex + 1 }} / {{ slides.length }}
        </span>
      </template>
    </div>

    <div v-if="slides.length > 1" class="flex justify-center gap-1.5 mt-3">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        class="w-2 h-2 p-0 border-0 rounded-full cursor-pointer transition-colors"
        :class="activeIndex === i ? 'bg-emerald-600' : 'bg-gray-300'"
        :aria-label="`第 ${i + 1} 张`"
        @click="activeIndex = i"
      />
    </div>

    <div v-if="slides.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-1">
      <button
        v-for="(src, i) in slides"
        :key="`thumb-${i}`"
        type="button"
        class="shrink-0 w-14 h-14 p-0 border-2 rounded-md overflow-hidden cursor-pointer bg-transparent transition-colors"
        :class="activeIndex === i ? 'border-emerald-600' : 'border-transparent'"
        @click="activeIndex = i"
      >
        <img :src="src" alt="" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  mainImage: string;
  images?: string[];
}>();

const slides = computed(() => {
  const list: string[] = [];
  const main = props.mainImage?.trim();
  if (main) list.push(main);
  for (const url of props.images ?? []) {
    const u = typeof url === 'string' ? url.trim() : '';
    if (u && !list.includes(u)) list.push(u);
  }
  return list;
});

const activeIndex = ref(0);

watch(slides, () => {
  activeIndex.value = 0;
});

function goPrev() {
  const n = slides.value.length;
  activeIndex.value = (activeIndex.value - 1 + n) % n;
}

function goNext() {
  const n = slides.value.length;
  activeIndex.value = (activeIndex.value + 1) % n;
}
</script>
