<template>
  <Teleport to="body">
    <div
      v-if="modal.visible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      @click.self="modal.close()"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h2 id="login-modal-title" class="text-xl font-semibold">登录</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="关闭"
            @click="modal.close()"
          >
            ×
          </button>
        </div>
        <form class="space-y-3" @submit.prevent="submit">
          <input
            v-model="phone"
            class="w-full border rounded px-3 py-2"
            placeholder="手机号"
            autocomplete="tel"
          />
          <input
            v-model="password"
            type="password"
            class="w-full border rounded px-3 py-2"
            placeholder="密码"
            autocomplete="current-password"
          />
          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
          <button
            type="submit"
            class="w-full bg-emerald-600 text-white py-2 rounded disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? '登录中…' : '登录' }}
          </button>
        </form>
        <p class="text-xs text-gray-500 mt-3">演示账号：13800138000 / user123</p>
        <p class="text-sm mt-3 text-center">
          没有账号？
          <NuxtLink to="/register" class="text-emerald-600" @click="modal.close()">去注册</NuxtLink>
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const modal = useLoginModalStore();
const auth = useAuthStore();

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
    const target = modal.redirectPath;
    modal.close();
    if (import.meta.client) {
      const current = window.location.pathname + window.location.search;
      if (target && target !== current) {
        window.location.href = target;
      } else {
        window.location.reload();
      }
    }
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
