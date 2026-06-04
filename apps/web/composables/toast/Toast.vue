<template>
  <div
    v-if="current"
    class="toast-overlay fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
  >
    <Transition name="toast-fade">
      <div v-if="current.visible" class="toast-bubble">
        {{ current.entry.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { current } from './shared';
</script>

<!-- createApp 挂载到 body：气泡样式写死，避免 Tailwind 未打入子应用 -->
<style>
.toast-overlay {
  background-color: rgb(0 0 0 / 0.05);
}
.toast-bubble {
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  background-color: #111827;
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.25rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  white-space: nowrap;
}
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
