<template>
  <Teleport to="body">
    <div
      v-if="mounted && !store.isOpen"
      ref="btnRef"
      class="ai-chat-fab"
      :style="fabStyle"
      @mousedown.prevent="onTouchStart"
      @touchstart.prevent="onTouchStart"
      @click.stop="onClick"
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
let startX = 0;
let startY = 0;
let moved = false;

const fabStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  transform: 'none',
}));

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function onTouchStart(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('.chat-toggle-ignore')) return;
  dragging.value = true;
  moved = false;
  const pt = 'touches' in e ? e.touches[0] : e;
  startX = pt.clientX - posX.value;
  startY = pt.clientY - posY.value;

  const onMove = (ev: MouseEvent | TouchEvent) => {
    if (!dragging.value) return;
    const p = 'touches' in ev ? ev.touches[0] : ev;
    const dx = Math.abs(p.clientX - startX - posX.value);
    const dy = Math.abs(p.clientY - startY - posY.value);
    if (dx > 3 || dy > 3) moved = true;
    posX.value = clamp(p.clientX - startX, 8, window.innerWidth - 64);
    posY.value = clamp(p.clientY - startY, 8, window.innerHeight - 64);
  };

  const onUp = () => {
    dragging.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);
}

function onClick() {
  if (moved) return;
  store.toggle();
}

onMounted(() => {
  posX.value = window.innerWidth - 72;
  posY.value = window.innerHeight - 160;
  mounted.value = true;
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
