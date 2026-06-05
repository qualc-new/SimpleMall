/** AI 对话状态管理 */
export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false);
  const messages = ref<{ role: 'user' | 'assistant' | 'system'; content: string; toolCalls?: unknown[] }[]>([]);
  const streaming = ref(false);
  const conversationId = ref<string | null>(null);

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  function addMessage(msg: { role: 'user' | 'assistant'; content: string }) {
    messages.value.push(msg);
  }

  function appendToLast(chunk: string) {
    const last = messages.value[messages.value.length - 1];
    if (last && last.role === 'assistant') {
      last.content += chunk;
    } else {
      messages.value.push({ role: 'assistant', content: chunk });
    }
  }

  function setConversationId(id: string) {
    conversationId.value = id;
  }

  function clearMessages() {
    messages.value = [];
    conversationId.value = null;
  }

  return {
    isOpen, messages, streaming, conversationId,
    toggle, open, close, addMessage, appendToLast, setConversationId, clearMessages,
  };
});
