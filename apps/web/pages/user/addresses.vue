<template>
  <div class="max-w-lg">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold">{{ pickMode ? '选择收货地址' : '收货地址' }}</h1>
      <button v-if="!pickMode" class="text-emerald-600 text-sm" @click="showForm = true">新增</button>
    </div>
    <p v-if="pickMode" class="text-sm text-gray-500 mb-3">点击地址即可选中并返回</p>
    <ul class="space-y-3">
      <li
        v-for="a in list"
        :key="a.id"
        class="bg-white p-4 rounded-lg shadow text-sm transition-colors"
        :class="pickMode ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400' : ''"
        @click="pickMode ? pickAddress(a) : undefined"
      >
        <p class="font-medium">
          {{ a.name }} {{ a.phone }}
          <span v-if="a.isDefault" class="text-emerald-600">默认</span>
        </p>
        <p class="text-gray-600">{{ a.province }}{{ a.city }}{{ a.district }}{{ a.detail }}</p>
        <div v-if="!pickMode" class="mt-2 flex gap-3">
          <button type="button" class="text-emerald-600" @click.stop="edit(a)">编辑</button>
          <button type="button" class="text-red-500" @click.stop="remove(a.id)">删除</button>
        </div>
        <button
          v-else
          type="button"
          class="mt-2 text-emerald-600 font-medium"
          @click.stop="pickAddress(a)"
        >
          选择此地址
        </button>
      </li>
    </ul>
    <p v-if="!list.length" class="text-gray-500 text-sm">暂无地址，请先新增</p>
    <button
      v-if="pickMode"
      type="button"
      class="mt-4 text-emerald-600 text-sm"
      @click="showForm = true"
    >
      + 新增地址
    </button>

    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      @click.self="showForm = false"
    >
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
import { savePickedAddress, type PickedAddress } from '../../composables/useAddressPick';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const api = useApi();

const pickMode = computed(() => route.query.pick === '1');
const returnTo = computed(() => {
  const from = route.query.from;
  return typeof from === 'string' && from.startsWith('/') ? from : '';
});

type AddressItem = PickedAddress & {
  name: string;
  phone: string;
  detail: string;
};

const list = ref<AddressItem[]>([]);
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
  list.value = await api<AddressItem[]>('/addresses');
}

function pickAddress(a: AddressItem) {
  savePickedAddress({
    id: a.id,
    province: a.province,
    city: a.city,
    district: a.district,
    name: a.name,
    phone: a.phone,
    detail: a.detail,
    isDefault: a.isDefault,
  });
  if (returnTo.value) {
    navigateTo(returnTo.value);
  } else {
    router.back();
  }
}

function edit(a: AddressItem) {
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
  if (pickMode.value && list.value.length === 1) {
    pickAddress(list.value[0]);
  }
}

async function remove(id: number) {
  if (!confirm('确定删除？')) return;
  await api(`/addresses/${id}`, { method: 'DELETE' });
  await load();
}

onMounted(load);
</script>
