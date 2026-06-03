<template>
  <div class="product-carousel" :class="{ 'product-carousel--single': slides.length <= 1 }">
    <div class="product-carousel__viewport">
      <div
        class="product-carousel__track"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <img
          v-for="(src, i) in slides"
          :key="`${src}-${i}`"
          :src="src"
          class="product-carousel__slide"
          :alt="`商品图 ${i + 1}`"
        />
      </div>
      <template v-if="slides.length > 1">
        <button
          type="button"
          class="product-carousel__arrow product-carousel__arrow--prev"
          aria-label="上一张"
          @click="goPrev"
        >
          ‹
        </button>
        <button
          type="button"
          class="product-carousel__arrow product-carousel__arrow--next"
          aria-label="下一张"
          @click="goNext"
        >
          ›
        </button>
        <span class="product-carousel__counter">{{ activeIndex + 1 }} / {{ slides.length }}</span>
      </template>
    </div>

    <div v-if="slides.length > 1" class="product-carousel__dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        class="product-carousel__dot"
        :class="{ 'product-carousel__dot--active': activeIndex === i }"
        :aria-label="`第 ${i + 1} 张`"
        @click="activeIndex = i"
      />
    </div>

    <div v-if="slides.length > 1" class="product-carousel__thumbs">
      <button
        v-for="(src, i) in slides"
        :key="`thumb-${i}`"
        type="button"
        class="product-carousel__thumb"
        :class="{ 'product-carousel__thumb--active': activeIndex === i }"
        @click="activeIndex = i"
      >
        <img :src="src" alt="" />
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

<style scoped>
.product-carousel {
  width: 100%;
}

.product-carousel__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
}

.product-carousel__track {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
}

.product-carousel__slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  margin-top: -1rem;
  border: none;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.92);
  color: #374151;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.product-carousel__arrow:hover {
  background-color: #ffffff;
}

.product-carousel__arrow--prev {
  left: 0.5rem;
}

.product-carousel__arrow--next {
  right: 0.5rem;
}

.product-carousel__counter {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  z-index: 2;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.45);
  border-radius: 9999px;
}

.product-carousel__dots {
  display: flex;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.product-carousel__dot {
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background-color: #d1d5db;
  cursor: pointer;
}

.product-carousel__dot--active {
  background-color: #059669;
}

.product-carousel__thumbs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.product-carousel__thumb {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  background: none;
}

.product-carousel__thumb--active {
  border-color: #059669;
}

.product-carousel__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
