/** 待展示条目（队列内） */
export interface ToastEntry {
  id: number;
  message: string;
  duration: number;
  autoClose: boolean;
}

/** 当前正在展示的条目 */
export interface ToastCurrent {
  entry: ToastEntry;
  visible: boolean;
}

/** 等待队列 */
export const queue = reactive<ToastEntry[]>([]);

/** 当前展示（同时仅一条） */
export const current = ref<ToastCurrent | null>(null);

/** 是否处于关闭动画中，避免与下一条重叠 */
export const playing = ref(false);

export const FADE_MS = 300;
