<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="font-semibold text-lg text-emerald-700">SimpleMall</NuxtLink>
        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink to="/products">商品</NuxtLink>
          <NuxtLink to="/cart">购物车{{ cartBadge }}</NuxtLink>
          <NuxtLink to="/orders">订单</NuxtLink>
          <template v-if="auth.user">
            <span class="text-gray-600">{{ auth.user.nickname || auth.user.phone }}</span>
            <button class="text-gray-500" @click="auth.logout()">退出</button>
          </template>
          <NuxtLink v-else to="/login" class="mr-2">登录</NuxtLink>
          <NuxtLink v-if="!auth.user" to="/register">注册</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const cart = useCartStore();

const cartBadge = computed(() => {
  const n = cart.count;
  return n > 0 ? ` (${n})` : '';
});

onMounted(() => {
  auth.hydrate();
  if (auth.accessToken) cart.fetchCart();
});
</script>
