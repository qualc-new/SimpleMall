import { getCurrentPath, handleWebUnauthorized, isWebAuthError } from './useAuthExpired';

const LOGIN_HINT =
  '请先登录后再使用 AI 助手。登录后我可以帮您查订单、问商品、改地址等。';

/** AI 对话 API 封装（SSE 流式 + 非流式回退） */
export function useChat() {
  const config = useRuntimeConfig();
  const store = useChatStore();

  /** 未登录：展示提示并打开登录弹窗 */
  function promptLogin(clearEmptyAssistant = false) {
    if (clearEmptyAssistant) {
      const last = store.messages[store.messages.length - 1];
      if (last?.role === 'assistant' && !last.content) {
        store.messages.pop();
      }
    }
    store.addMessage({ role: 'assistant', content: LOGIN_HINT });
    useLoginModalStore().open(getCurrentPath());
  }

  /** 会话过期：清理 token 并打开登录弹窗 */
  function promptSessionExpired(clearEmptyAssistant = false) {
    if (clearEmptyAssistant) {
      const last = store.messages[store.messages.length - 1];
      if (last?.role === 'assistant' && !last.content) {
        store.messages.pop();
      }
    }
    store.addMessage({ role: 'assistant', content: '登录已过期，请重新登录后继续对话。' });
    handleWebUnauthorized();
  }

  async function sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const auth = useAuthStore();
    auth.hydrate();

    store.addMessage({ role: 'user', content });

    // 未登录直接引导，不发起请求
    if (!auth.accessToken) {
      promptLogin();
      return;
    }

    store.streaming = true;
    store.addMessage({ role: 'assistant', content: '' });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    };

    const body = {
      messages: [{ role: 'user', content }],
      conversation_id: store.conversationId,
      stream: true,
    };

    try {
      const response = await fetch(`${config.public.apiBase}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        promptSessionExpired(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.conversation_id) {
              store.setConversationId(parsed.conversation_id);
            }
            if (parsed.content) {
              store.appendToLast(parsed.content);
            }
          } catch {
            // 非 JSON 行，跳过
          }
        }
      }
    } catch {
      // SSE 失败时回退到非流式
      const last = store.messages[store.messages.length - 1];
      if (last?.role === 'assistant' && !last.content) {
        store.messages.pop();
      }

      try {
        const res = await fetch(`${config.public.apiBase}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...body, stream: false }),
        });

        if (res.status === 401) {
          promptSessionExpired();
          return;
        }

        const data = (await res.json()) as {
          code?: number;
          message?: string | { role: string; content: string };
          conversationId?: string;
        };

        if (isWebAuthError(res.status, data.code)) {
          promptSessionExpired();
          return;
        }

        const msgContent =
          typeof data.message === 'string'
            ? data.message
            : data.message?.content || 'AI 未返回有效回复';

        store.addMessage({ role: 'assistant', content: msgContent });
        if (data.conversationId) store.setConversationId(data.conversationId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '请求失败';
        store.addMessage({ role: 'assistant', content: `抱歉，AI 服务暂时不可用：${msg}` });
      }
    } finally {
      store.streaming = false;
    }
  }

  return { sendMessage };
}
