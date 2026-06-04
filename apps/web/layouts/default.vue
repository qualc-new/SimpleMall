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
            <a
              href="https://github.com/qualc-new/SimpleMall"
              target="_blank"
              rel="noopener noreferrer"
              class="site-header__link site-header__github"
              aria-label="GitHub"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
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
