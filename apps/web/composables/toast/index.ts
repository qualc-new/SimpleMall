import { createApp, type App } from 'vue';
import ToastRoot from './Toast.vue';
import {
  current,
  queue,
  playing,
  FADE_MS,
  type ToastEntry,
} from './shared';

const TOAST_ROOT_ID = '__simplemall_toast__';

export type { ToastEntry };
export type ToastOptions = Partial<{
  /** 自动关闭延迟（毫秒） */
  duration: number;
  autoClose: boolean;
  /**
   * 仅展示第一条：若已有展示中或队列中待展示，后续调用直接丢弃
   * @default false — 默认排队轮流展示
   */
  onlyFirst: boolean;
}>;

let toastApp: App<Element> | null = null;
const autoCloseTimers = new Map<number, ReturnType<typeof setTimeout>>();

/** 通过 createApp 挂载 Toast 根实例（仅客户端，幂等） */
export function mountToastApp() {
  if (!import.meta.client || toastApp) return;

  let container = document.getElementById(TOAST_ROOT_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_ROOT_ID;
    document.body.appendChild(container);
  }

  const app = createApp(ToastRoot);
  try {
    const { vueApp } = useNuxtApp();
    Object.assign(app._context, vueApp._context);
  } catch {
    // 非 Nuxt 运行时忽略
  }
  app.mount(container);
  toastApp = app;
}

function ensureMounted() {
  mountToastApp();
}

function clearAutoCloseTimer(id: number) {
  const t = autoCloseTimers.get(id);
  if (t) {
    clearTimeout(t);
    autoCloseTimers.delete(id);
  }
}

/** 关闭当前条并尝试播放下一条 */
function dismissCurrent() {
  if (!current.value || playing.value) return;
  const id = current.value.entry.id;
  clearAutoCloseTimer(id);
  playing.value = true;
  current.value.visible = false;

  setTimeout(() => {
    if (current.value?.entry.id === id) current.value = null;
    playing.value = false;
    playNext();
  }, FADE_MS);
}

/** 从队列取下一条并展示 */
function playNext() {
  if (playing.value || current.value || !queue.length) return;

  const entry = queue.shift()!;
  playing.value = false;
  current.value = { entry, visible: true };

  if (entry.autoClose) {
    const timer = setTimeout(() => dismissCurrent(), entry.duration);
    autoCloseTimers.set(entry.id, timer);
  }
}

function removeFromQueue(id: number) {
  const i = queue.findIndex((t) => t.id === id);
  if (i !== -1) queue.splice(i, 1);
}

/** 显示 Toast，返回手动关闭函数 */
export function show(message: string, options: ToastOptions = {}) {
  if (import.meta.client) ensureMounted();

  const { duration = 1800, autoClose = true, onlyFirst = false } = options;

  // onlyFirst：已有展示或排队则丢弃
  if (onlyFirst && (current.value || queue.length > 0)) {
    return () => {};
  }

  const id = Date.now() + Math.floor(Math.random() * 1000);
  const entry: ToastEntry = { id, message, duration, autoClose };
  queue.push(entry);
  playNext();

  return () => {
    removeFromQueue(id);
    if (current.value?.entry.id === id) dismissCurrent();
    clearAutoCloseTimer(id);
  };
}

export function useToast() {
  return {
    show,
    toast: (message: string, duration?: number) =>
      show(message, duration !== undefined ? { duration } : {}),
  };
}
