<template>
  <div class="max-w-lg">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold">收货地址</h1>
      <button class="text-emerald-600 text-sm" @click="showForm = true">新增</button>
    </div>
    <ul class="space-y-3">
      <li v-for="a in list" :key="a.id" class="bg-white p-4 rounded-lg shadow text-sm">
        <p class="font-medium">{{ a.name }} {{ a.phone }} <span v-if="a.isDefault" class="text-emerald-600">默认</span></p>
        <p class="text-gray-600">{{ a.province }}{{ a.city }}{{ a.district }}{{ a.detail }}</p>
        <div class="mt-2 flex gap-3">
          <button class="text-emerald-600" @click="edit(a)">编辑</button>
          <button class="text-red-500" @click="remove(a.id)">删除</button>
        </div>
      </li>
    </ul>

    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4" @click.self="showForm = false">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-2" @submit.prevent="save">
        <h2 class="font-semibold">{{ form.id ? '编辑' : '新增' }}地址</h2>
        <input v-model="form.name" class="w-full border rounded px-3 py-2" placeholder="收货人" required />
        <input v-model="form.phone" class="w-full border rounded px-3 py-2" placeholder="手机号" required />
        <input v-model="form.province" class="w-full border rounded px-3 py-2" placeholder="省" required />
        <input v-model="form.city" class="w-full border rounded px-3 py-2" placeholder="市" required />
        <input v-model="form.district" class="w-full border rounded px-3 py-2" placeholder="区" required />
        <input v-model="form.detail" class="w-full border rounded px-3 py-2" placeholder="详细地址" required />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isDefault" type="checkbox" /> 设为默认
        </label>
        <button class="w-full bg-emerald-600 text-white py-2 rounded">保存</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const api = useApi();
const list = ref<Array<Record<string, unknown> & { id: number }>>([]);
const showForm = ref(false);
const form = reactive({
  id: 0,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
});

async function load() {
  list.value = await api('/addresses');
}

function edit(a: (typeof list.value)[0]) {
  Object.assign(form, a);
  showForm.value = true;
}

async function save() {
  const body = { ...form };
  delete (body as { id?: number }).id;
  if (form.id) {
    await api(`/addresses/${form.id}`, { method: 'PUT', body });
  } else {
    await api('/addresses', { method: 'POST', body });
  }
  showForm.value = false;
  await load();
}

async function remove(id: number) {
  if (!confirm('确定删除？')) return;
  await api(`/addresses/${id}`, { method: 'DELETE' });
  await load();
}

onMounted(load);
</script>
