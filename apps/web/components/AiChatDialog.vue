<template>
  <Teleport to="body">
    <Transition name="chat-slide">
      <div v-if="store.isOpen" class="ai-chat-dialog">
        <!-- 头部 -->
        <div class="ai-chat-dialog__header">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🤖</span>
            <div>
              <h3 class="text-sm font-semibold text-white">AI 助手</h3>
              <p class="text-[11px] text-gray-400">智能购物顾问</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="ai-chat-header-btn"
              title="清空对话"
              @click="store.clearMessages()"
            >
              🗑
            </button>
            <button
              class="ai-chat-header-btn"
              title="关闭"
              @click="store.close()"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="ai-chat-dialog__login-hint">
          <p class="text-xs text-amber-700">登录后可查订单、问商品、改地址</p>
          <button class="ai-chat-login-btn" @click="openLogin">去登录</button>
        </div>

        <!-- 快捷提示 -->
        <div v-if="store.messages.length === 0 && isLoggedIn" class="ai-chat-dialog__hints">
          <p class="text-xs text-gray-400 mb-2">试试问我：</p>
          <button
            v-for="hint in quickHints"
            :key="hint"
            class="ai-chat-hint"
            @click="onHint(hint)"
          >
            {{ hint }}
          </button>
        </div>

        <!-- 消息列表 -->
        <div ref="listRef" class="ai-chat-dialog__messages">
          <div
            v-for="(msg, i) in store.messages"
            :key="i"
            :class="['ai-chat-msg', msg.role === 'user' ? 'ai-chat-msg--user' : 'ai-chat-msg--ai']"
          >
            <div class="ai-chat-msg__bubble">
              <!-- 简单 Markdown 渲染：链接、换行、粗体 -->
              <span v-html="renderContent(msg.content)" />
              <!-- 流式光标 -->
              <span
                v-if="store.streaming && i === store.messages.length - 1 && msg.role === 'assistant'"
                class="ai-chat-cursor"
              />
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="store.messages.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-300">
            <span class="text-5xl mb-3">💬</span>
            <p class="text-sm">我是您的 AI 购物助手</p>
            <p class="text-xs mt-1">
              {{ isLoggedIn ? '可以帮您查订单、问商品、改地址' : '请先登录后开始对话' }}
            </p>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="ai-chat-dialog__input">
          <textarea
            v-model="input"
            class="ai-chat-input"
            rows="1"
            placeholder="输入您的问题…"
            :disabled="store.streaming"
            @keydown.enter.exact.prevent="submit"
            @input="autoResize"
          />
          <button
            class="ai-chat-send"
            :disabled="!input.trim() || store.streaming"
            @click="submit"
          >
            <span v-if="!store.streaming">↑</span>
            <span v-else class="ai-chat-send__loading" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/** AI 对话弹窗 */
const store = useChatStore();
const auth = useAuthStore();
const { sendMessage } = useChat();
const input = ref('');
const listRef = ref<HTMLElement | null>(null);

const isLoggedIn = computed(() => {
  auth.hydrate();
  return !!auth.accessToken;
});

function openLogin() {
  useLoginModalStore().open(getCurrentPath());
}

const quickHints = [
  '我的订单',
  '帮我查一下最近买的商品',
  '有什么优惠券吗',
  '我要退货',
];

async function submit() {
  const val = input.value.trim();
  if (!val || store.streaming) return;
  input.value = '';
  await sendMessage(val);
  await nextTick();
  scrollToBottom();
}

function onHint(hint: string) {
  input.value = hint;
  submit();
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
}

function scrollToBottom() {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight;
  }
}

watch(() => store.messages.length, () => {
  nextTick(scrollToBottom);
});

/** 简单 Markdown 渲染：链接、粗体、换行 */
function renderContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="ai-chat-link">$1</a>')
    .replace(/\n/g, '<br>');
}
</script>

<style scoped>
.ai-chat-dialog {
  position: fixed;
  z-index: var(--z-chat-dialog, 95);
  right: 16px;
  bottom: 88px;
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 520px;
  max-height: calc(100vh - 120px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 移动端：底部全宽抽屉，避免右下角小窗被挤出视口 */
@media (max-width: 768px) {
  .ai-chat-dialog {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    height: min(88dvh, 100dvh);
    max-height: none;
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  }
}

/* 头部 */
.ai-chat-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
  border-radius: 16px 16px 0 0;
}
.ai-chat-header-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.ai-chat-header-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* 未登录提示条 */
.ai-chat-dialog__login-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  flex-shrink: 0;
}
.ai-chat-login-btn {
  padding: 4px 12px;
  border-radius: 9999px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

/* 快捷提示 */
.ai-chat-dialog__hints {
  padding: 10px 16px 4px;
  flex-shrink: 0;
}
.ai-chat-hint {
  display: inline-block;
  margin: 0 6px 6px 0;
  padding: 5px 12px;
  background: #f0eeff;
  color: #6644b8;
  border: 1px solid #e4dcff;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.ai-chat-hint:hover {
  background: #e4dcff;
}

/* 消息列表 */
.ai-chat-dialog__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ai-chat-dialog__messages::-webkit-scrollbar {
  width: 4px;
}
.ai-chat-dialog__messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* 消息气泡 */
.ai-chat-msg {
  display: flex;
  max-width: 85%;
}
.ai-chat-msg--user {
  align-self: flex-end;
}
.ai-chat-msg--ai {
  align-self: flex-start;
}
.ai-chat-msg__bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
}
.ai-chat-msg--user .ai-chat-msg__bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.ai-chat-msg--ai .ai-chat-msg__bubble {
  background: #f3f4f6;
  color: #374151;
  border-bottom-left-radius: 4px;
}

/* 流式光标 */
.ai-chat-cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background: #667eea;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ai-blink 0.8s step-end infinite;
}
@keyframes ai-blink {
  50% { opacity: 0; }
}

/* 链接 */
:deep(.ai-chat-link) {
  color: #667eea;
  text-decoration: underline;
}

/* 输入区 */
.ai-chat-dialog__input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.ai-chat-input {
  flex: 1;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 13px;
  line-height: 1.4;
  outline: none;
  resize: none;
  min-height: 38px;
  max-height: 120px;
  font-family: inherit;
  transition: border-color 0.2s;
}
.ai-chat-input:focus {
  border-color: #667eea;
}
.ai-chat-send {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s, transform 0.15s;
}
.ai-chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ai-chat-send:not(:disabled):active {
  transform: scale(0.92);
}
.ai-chat-send__loading {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ai-spin 0.7s linear infinite;
}
@keyframes ai-spin {
  to { transform: rotate(360deg); }
}

/* Transition */
.chat-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.chat-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.chat-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
@media (max-width: 768px) {
  .chat-slide-enter-from,
  .chat-slide-leave-to {
    opacity: 1;
    transform: translateY(100%);
  }
}
</style>
