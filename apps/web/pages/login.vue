<template>
  <div class="max-w-sm mx-auto bg-white p-6 rounded-xl shadow">
    <h1 class="text-xl font-semibold mb-4">登录</h1>
    <form class="space-y-3" @submit.prevent="submit">
      <input v-model="phone" class="w-full border rounded px-3 py-2" placeholder="手机号" />
      <input v-model="password" type="password" class="w-full border rounded px-3 py-2" placeholder="密码" />
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <button class="w-full bg-emerald-600 text-white py-2 rounded" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
    <p class="text-xs text-gray-500 mt-3">演示账号：13800138000 / user123</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const route = useRoute();
const phone = ref('13800138000');
const password = ref('user123');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(phone.value, password.value);
    const cart = useCartStore();
    await cart.fetchCart();
    navigateTo((route.query.redirect as string) || '/');
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
