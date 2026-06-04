<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="site-header">
      <div class="site-container site-header__inner">
        <div class="site-header__top">
          <NuxtLink to="/" class="site-header__brand">
            <span class="site-header__logo">SM</span>
            <span>
              <span class="site-header__title">SimpleMall</span>
              <span class="site-header__slogan">轻量电商演示</span>
            </span>
          </NuxtLink>

          <div class="site-header__center" :class="{ 'site-header__center--home': isHomePage }">
            <form class="site-header__search" @submit.prevent="submitSearch">
              <div class="site-header__search-box">
                <input
                  v-model="keyword"
                  type="search"
                  class="site-header__search-input"
                  placeholder="搜索商品名称、卖点…"
                  autocomplete="off"
                />
                <button type="submit" class="site-header__search-btn">搜索</button>
              </div>
            </form>

            <div v-if="isHomePage && hotTags.length" class="site-header__tags">
              <span class="site-header__tags-label">热门</span>
              <div class="site-header__tags-scroll">
                <button
                  v-for="t in hotTags"
                  :key="t.id"
                  type="button"
                  class="site-header__tag"
                  @click="searchByTag(t.name)"
                >
                  {{ t.name }}
                </button>
              </div>
            </div>
          </div>

          <nav class="site-header__nav site-header__nav--desktop">
            <NuxtLink to="/products" class="site-header__link">商品</NuxtLink>
            <NuxtLink to="/cart" class="site-header__link">购物车{{ cartBadge }}</NuxtLink>
            <NuxtLink to="/orders" class="site-header__link">订单</NuxtLink>
            <template v-if="auth.user">
              <span class="site-header__user">{{ auth.user.nickname || auth.user.phone }}</span>
              <button type="button" class="site-header__logout" @click="auth.logout()">退出</button>
            </template>
            <NuxtLink v-else to="/login" class="site-header__link site-header__link--primary">登录</NuxtLink>
          </nav>

          <nav class="site-header__nav site-header__nav--mobile">
            <NuxtLink to="/cart" class="site-header__link">购物车{{ cartBadge }}</NuxtLink>
            <NuxtLink to="/orders" class="site-header__link">订单</NuxtLink>
            <NuxtLink v-if="!auth.user" to="/login" class="site-header__link site-header__link--primary">登录</NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1 site-container py-6 w-full">
      <slot />
    </main>
    <AppFooter />
    <LoginModal />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const cart = useCartStore();
const route = useRoute();
const api = useApi();
const { keyword, searchByTag, submitSearch } = useHeaderSearch();

const isHomePage = computed(() => route.path === '/');

const { data: hotTagData } = await useAsyncData(
  'header-hot-tags',
  () => (isHomePage.value ? api<Array<{ id: number; name: string }>>('/tags/hot') : Promise.resolve([])),
  { watch: [isHomePage] },
);
const hotTags = computed(() => hotTagData.value ?? []);

const cartBadge = computed(() => {
  const n = cart.count;
  return n > 0 ? ` (${n})` : '';
});

onMounted(() => {
  auth.hydrate();
  if (auth.accessToken) {
    cart.fetchCart();
  } else {
    cart.items = [];
  }
});
</script>
