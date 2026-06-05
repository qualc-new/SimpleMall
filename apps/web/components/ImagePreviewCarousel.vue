<template>
  <Teleport to="body">
    <div
      v-if="open && slides.length"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click.self="close"
    >
      <button
        type="button"
        class="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
        aria-label="关闭预览"
        @click="close"
      >
        &times;
      </button>
      <div class="flex items-center gap-4 max-w-3xl w-full">
        <button
          v-if="slides.length > 1"
          type="button"
          class="text-white text-3xl shrink-0 w-10 h-10 flex items-center justify-center rounded hover:bg-white/20"
          aria-label="上一张"
          @click="goPrev"
        >
          ‹
        </button>
        <img
          :src="slides[activeIndex]"
          class="max-h-[80vh] max-w-full object-contain rounded"
          alt=""
        />
        <button
          v-if="slides.length > 1"
          type="button"
          class="text-white text-3xl shrink-0 w-10 h-10 flex items-center justify-center rounded hover:bg-white/20"
          aria-label="下一张"
          @click="goNext"
        >
          ›
        </button>
      </div>
      <div v-if="slides.length > 1" class="absolute bottom-6 text-white text-sm">
        {{ activeIndex + 1 }} / {{ slides.length }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 图片 URL 列表 */
    images: string[];
    /** 打开预览时的默认下标 */
    initialIndex?: number;
  }>(),
  { initialIndex: 0 },
);

/** 是否显示预览层 */
const open = defineModel<boolean>({ default: false });

const slides = computed(() =>
  props.images.map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean),
);

const activeIndex = ref(0);

function clampIndex(index: number) {
  const max = Math.max(0, slides.value.length - 1);
  return Math.min(Math.max(0, index), max);
}

function syncIndex() {
  activeIndex.value = clampIndex(props.initialIndex);
}

watch(open, (visible) => {
  if (visible) syncIndex();
});

watch(
  () => props.initialIndex,
  () => {
    if (open.value) syncIndex();
  },
);

watch(slides, () => {
  if (open.value) syncIndex();
});

function close() {
  open.value = false;
}

function goPrev() {
  const n = slides.value.length;
  if (n <= 1) return;
  activeIndex.value = (activeIndex.value - 1 + n) % n;
}

function goNext() {
  const n = slides.value.length;
  if (n <= 1) return;
  activeIndex.value = (activeIndex.value + 1) % n;
}
</script>
