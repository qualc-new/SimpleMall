<template>
  <Teleport to="body">
    <div
      v-if="mounted && !store.isOpen"
      ref="btnRef"
      class="ai-chat-fab"
      :style="fabStyle"
      @mousedown.prevent="onPointerDown"
      @touchstart="onPointerDown"
    >
      <span class="ai-chat-fab__icon">🤖</span>
      <span v-if="!store.isOpen" class="ai-chat-fab__badge">AI</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** 可拖拽的 AI 对话浮动按钮（纯客户端渲染，避免 SSR window 访问） */
const store = useChatStore();

const mounted = ref(false);
const btnRef = ref<HTMLElement | null>(null);
const posX = ref(0);
const posY = ref(0);
const dragging = ref(false);
/** 位移超过该阈值视为拖拽，否则视为点击打开 */
const TAP_THRESHOLD = 10;
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;
let moved = false;

const fabStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  transform: 'none',
}));

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function placeFabDefault() {
  const margin = 16;
  const size = 56;
  posX.value = Math.max(margin, window.innerWidth - size - margin);
  // 移动端底部常有 Tab/购买栏，抬高默认位置避免被遮挡
  const bottomGap = window.innerWidth <= 768 ? 96 : 72;
  posY.value = Math.max(margin, window.innerHeight - size - bottomGap);
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('.chat-toggle-ignore')) return;
  dragging.value = true;
  moved = false;
  const pt = 'touches' in e ? e.touches[0] : e;
  originX = pt.clientX;
  originY = pt.clientY;
  startX = pt.clientX - posX.value;
  startY = pt.clientY - posY.value;

  const onMove = (ev: MouseEvent | TouchEvent) => {
    if (!dragging.value) return;
    const p = 'touches' in ev ? ev.touches[0] : ev;
    if (Math.abs(p.clientX - originX) > TAP_THRESHOLD || Math.abs(p.clientY - originY) > TAP_THRESHOLD) {
      moved = true;
    }
    if (!moved) return;
    if ('touches' in ev) ev.preventDefault();
    posX.value = clamp(p.clientX - startX, 8, window.innerWidth - 64);
    posY.value = clamp(p.clientY - startY, 8, window.innerHeight - 64);
  };

  const onUp = (ev: MouseEvent | TouchEvent) => {
    if (!moved) {
      store.open();
    }
    dragging.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
    void ev;
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);
}

onMounted(() => {
  placeFabDefault();
  mounted.value = true;
  window.addEventListener('resize', placeFabDefault);
});

onUnmounted(() => {
  window.removeEventListener('resize', placeFabDefault);
});
</script>

<style scoped>
.ai-chat-fab {
  position: fixed;
  z-index: var(--z-chat-fab, 90);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: box-shadow 0.2s, transform 0.15s;
}
.ai-chat-fab:hover {
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
}
.ai-chat-fab:active {
  transform: scale(0.94);
}
.ai-chat-fab__icon {
  font-size: 24px;
  line-height: 1;
}
.ai-chat-fab__badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  margin-top: 1px;
  letter-spacing: 0.5px;
}
</style>
