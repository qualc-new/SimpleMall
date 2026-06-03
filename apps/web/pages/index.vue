<template>
  <div class="home-content space-y-10">
    <!-- 热门活动 -->
    <section v-if="home?.activities?.length">
      <h2 class="text-lg font-semibold mb-4">热门活动</h2>
      <div class="grid grid-cols-4 gap-3 bp-768:grid-cols-2 bp-375:grid-cols-1">
        <NuxtLink
          v-for="a in home.activities"
          :key="a.id"
          :to="a.link"
          class="rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white min-h-[100px] flex flex-col justify-end p-4 hover:opacity-95 relative"
        >
          <img
            v-if="a.image"
            :src="a.image"
            class="absolute inset-0 w-full h-full object-cover opacity-40"
            alt=""
          />
          <div class="relative z-10">
            <p class="font-semibold">{{ a.title }}</p>
            <p class="text-xs opacity-90 mt-1">{{ a.subtitle }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 推荐商品 -->
    <section v-if="home?.recommend?.length">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">推荐商品</h2>
        <NuxtLink to="/products?recommend=1" class="text-sm text-emerald-600">查看更多</NuxtLink>
      </div>
      <div class="grid grid-cols-4 gap-4 bp-1024:grid-cols-3 bp-768:grid-cols-2 bp-375:grid-cols-1">
        <ProductCard v-for="item in home.recommend" :key="item.id" :item="item" />
      </div>
    </section>

    <!-- 分类 / 标签 筛选 -->
    <section>
      <h2 class="text-lg font-semibold mb-4">发现好物</h2>
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="shrink-0 px-4 py-2 rounded-full text-sm transition-colors"
          :class="
            activeTab === tab.key
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-400'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div v-if="listPending" class="text-gray-500 py-8 text-center">加载中…</div>
      <div v-else-if="!feedList.length" class="text-gray-500 py-8 text-center">暂无商品</div>
      <div v-else class="grid grid-cols-4 gap-4 mt-4 bp-1024:grid-cols-3 bp-768:grid-cols-2 bp-375:grid-cols-1">
        <ProductCard v-for="item in feedList" :key="item.id" :item="item" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const api = useApi();
const activeTab = ref('guess');

type SpuCard = {
  id: number;
  title: string;
  subtitle?: string;
  mainImage: string;
  minPrice: number;
  marketPrice?: number;
  tagList?: string[];
};

type HomeData = {
  hotTags: Array<{ id: number; name: string }>;
  filterTags: Array<{ id: number; name: string; isHot?: boolean }>;
  categories: Array<{ id: number; name: string }>;
  activities: Array<{ id: number; title: string; subtitle: string; image: string | null; link: string }>;
  recommend: SpuCard[];
};

const { data: home } = await useAsyncData('home', () => api<HomeData>('/home'));

const tabs = computed(() => {
  const items: { key: string; label: string; categoryId?: number; tag?: string }[] = [
    { key: 'guess', label: '猜你喜欢' },
  ];
  for (const c of home.value?.categories ?? []) {
    items.push({ key: `cat-${c.id}`, label: c.name, categoryId: c.id });
  }
  for (const t of home.value?.filterTags ?? []) {
    if (!items.some((x) => x.tag === t.name)) {
      items.push({ key: `tag-${t.id}`, label: t.name, tag: t.name });
    }
  }
  return items;
});

const currentFilter = computed(() => {
  const tab = tabs.value.find((t) => t.key === activeTab.value);
  if (!tab || tab.key === 'guess') return {};
  if (tab.categoryId) return { categoryId: tab.categoryId };
  if (tab.tag) return { tag: tab.tag };
  return {};
});

const feedKey = computed(() => `home-feed-${activeTab.value}`);

const { data: feedData, pending: listPending } = await useAsyncData(
  feedKey,
  () => {
    const f = currentFilter.value;
    return api<{ list: SpuCard[] }>('/spus', {
      query: {
        pageSize: 12,
        ...(f.categoryId ? { categoryId: f.categoryId } : {}),
        ...(f.tag ? { tag: f.tag } : {}),
      },
    });
  },
  { watch: [activeTab] },
);

const feedList = computed(() => feedData.value?.list ?? []);
</script>
