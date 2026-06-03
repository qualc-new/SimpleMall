<template>
  <div class="max-w-sm mx-auto bg-white p-6 rounded-xl shadow">
    <h1 class="text-xl font-semibold mb-4">注册</h1>
    <form class="space-y-3" @submit.prevent="submit">
      <input v-model="phone" class="w-full border rounded px-3 py-2" placeholder="手机号" />
      <input v-model="nickname" class="w-full border rounded px-3 py-2" placeholder="昵称（可选）" />
      <input v-model="password" type="password" class="w-full border rounded px-3 py-2" placeholder="密码" />
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <button class="w-full bg-emerald-600 text-white py-2 rounded" :disabled="loading">注册</button>
    </form>
    <NuxtLink to="/login" class="text-sm text-emerald-600 mt-3 inline-block">已有账号？登录</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const phone = ref('');
const nickname = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const api = useApi();
    const data = await api<{ accessToken: string; user: { id: number; phone: string; nickname?: string } }>(
      '/auth/register',
      { method: 'POST', body: { phone: phone.value, password: password.value, nickname: nickname.value || undefined } },
    );
    auth.accessToken = data.accessToken;
    auth.user = data.user;
    if (import.meta.client) {
      localStorage.setItem('sm_access_token', data.accessToken);
      localStorage.setItem('sm_user', JSON.stringify(data.user));
    }
    navigateTo('/');
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>
