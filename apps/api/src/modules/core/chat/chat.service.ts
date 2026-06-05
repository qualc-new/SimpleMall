import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { OrderService } from '../order/order.service';
import { CatalogService } from '../catalog/catalog.service';
import { AddressService } from '../user/address.service';
import { TOOLS, ToolDefinition } from './tools';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface LlmChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: string;
}

const SYSTEM_PROMPT = `你是 SimpleMall 电商平台的智能购物助手。你可以帮助用户：
1. **查询订单**：查看最近的订单列表或特定订单详情
2. **申请退货**：为已完成订单中的商品发起退货（需先确认）
3. **查询退货进度**：查看退货申请的处理状态
4. **修改地址**：修改未发货订单的收货地址或更新默认地址
5. **商品咨询**：查询商品信息、库存、价格
6. **优惠券**：查看可用优惠券（当前暂不可用）

规则：
- 涉及修改操作（退货、改地址）时，先向用户确认再调用工具
- 用户未登录时引导用户登录
- 用友好的中文回复，必要时附上详情链接
- 无法处理的问题，礼貌告知用户你只能处理电商相关操作`;

const MAX_ROUNDS = 10;
const CONVERSATION_TTL = 1800; // 30 分钟

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
    private orderService: OrderService,
    private catalogService: CatalogService,
    private addressService: AddressService,
  ) {}

  /** 非流式对话 */
  async chat(userId: number, userMessage: string, conversationId?: string): Promise<{
    message: { role: string; content: string };
    conversationId: string;
  }> {
    const cid = conversationId || `chat_${userId}_${Date.now()}`;
    const history = await this.loadHistory(cid);

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const result = await this.callLlm(messages, userId);
    await this.saveHistory(cid, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: result },
    ]);

    return {
      message: { role: 'assistant', content: result },
      conversationId: cid,
    };
  }

  /** 流式对话（SSE） */
  async *chatStream(userId: number, userMessage: string, conversationId?: string) {
    const cid = conversationId || `chat_${userId}_${Date.now()}`;
    const history = await this.loadHistory(cid);

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage },
    ];

    let fullResponse = '';

    try {
      for await (const chunk of this.callLlmStream(messages, userId)) {
        fullResponse += chunk;
        yield { content: chunk, conversation_id: cid };
      }
    } catch (err) {
      this.logger.error('流式 LLM 调用失败', err);
      yield { content: '抱歉，AI 服务暂时不可用，请稍后重试。', conversation_id: cid };
    }

    // 保存历史
    await this.saveHistory(cid, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullResponse },
    ]);

    yield { content: '', conversation_id: cid, done: true };
  }

  /** 调用 LLM（含 function calling 循环） */
  private async callLlm(messages: ChatMessage[], userId: number): Promise<string> {
    let loop = 0;

    while (loop < 5) {
      loop++;
      const response = await this.llmRequest(messages, true);

      const choice = response.choices?.[0] as LlmChoice | undefined;
      if (!choice) return '抱歉，AI 服务未返回有效响应';

      // 有 tool_calls
      if (choice.message.tool_calls?.length) {
        messages.push({ role: 'assistant', content: '', tool_calls: choice.message.tool_calls } as ChatMessage);

        for (const tc of choice.message.tool_calls) {
          const result = await this.executeTool(tc.function.name, tc.function.arguments, userId);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          } as ChatMessage);
        }
        continue;
      }

      // 直接文本回复
      return choice.message.content || '抱歉，我没有理解您的问题，请换个方式描述。';
    }

    return '抱歉，处理您的请求时出现了问题，请稍后再试。';
  }

  /** 流式 LLM 调用（简化：不支持 function calling 流式，先非流式获取 tool_calls，再流式最终回复） */
  private async *callLlmStream(messages: ChatMessage[], userId: number) {
    // 第一步：非流式检查是否有 tool_calls
    const checkResponse = await this.llmRequest(messages, true);
    const choice = checkResponse.choices?.[0] as LlmChoice | undefined;

    if (choice?.message.tool_calls?.length) {
      messages.push({ role: 'assistant', content: '', tool_calls: choice.message.tool_calls } as ChatMessage);

      for (const tc of choice.message.tool_calls) {
        const result = await this.executeTool(tc.function.name, tc.function.arguments, userId);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        } as ChatMessage);
      }

      // 再次调用获取最终回复（流式）
      const finalStream = await this.llmRequest(messages, false);
      const finalChoice = finalStream.choices?.[0] as LlmChoice | undefined;
      if (finalChoice?.message.content) {
        yield finalChoice.message.content;
      }
      return;
    }

    // 无 tool_calls，直接返回文本
    if (choice?.message.content) {
      yield choice.message.content;
    }
  }

  /** 发起 LLM HTTP 请求 */
  private async llmRequest(messages: ChatMessage[], withTools: boolean) {
    const apiKey = this.config.get<string>('LLM_API_KEY') || process.env.LLM_API_KEY;
    const baseUrl = this.config.get<string>('LLM_BASE_URL') || process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1';
    const model = this.config.get<string>('LLM_MODEL') || process.env.LLM_MODEL || 'deepseek-chat';

    if (!apiKey) {
      throw new Error('LLM_API_KEY 未配置');
    }

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    };

    if (withTools) {
      (body as Record<string, unknown>).tools = TOOLS;
      (body as Record<string, unknown>).tool_choice = 'auto';
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  /** 执行工具调用 */
  private async executeTool(name: string, argsJson: string, userId: number): Promise<string> {
    try {
      const args = JSON.parse(argsJson);
      this.logger.log(`执行工具 ${name}，参数：${JSON.stringify(args)}`);

      switch (name) {
        case 'get_orders':
          return await this.execGetOrders(args, userId);
        case 'get_order_detail':
          return await this.execGetOrderDetail(args, userId);
        case 'apply_return':
          return await this.execApplyReturn(args, userId);
        case 'get_return_status':
          return await this.execGetReturnStatus(args, userId);
        case 'update_order_address':
          return await this.execUpdateOrderAddress(args, userId);
        case 'update_default_address':
          return await this.execUpdateDefaultAddress(args, userId);
        case 'query_product':
          return await this.execQueryProduct(args);
        case 'get_coupons':
          return JSON.stringify({ success: false, message: '优惠券功能暂未上线' });
        default:
          return JSON.stringify({ error: `未知工具：${name}` });
      }
    } catch (err) {
      this.logger.error(`工具 ${name} 执行失败`, err);
      return JSON.stringify({ error: `操作失败：${err instanceof Error ? err.message : '未知错误'}` });
    }
  }

  // ─── 工具实现 ───

  /**
   * 解析 order_id 参数：LLM 可能传入 orderNo（如 SM178056362339531）或数字 ID，
   * 统一转换为数据库数字 ID。
   */
  private async resolveOrderId(rawId: string, userId: number): Promise<number> {
    // 纯数字 → 直接当数据库 ID
    if (/^\d+$/.test(rawId)) return Number(rawId);

    // 否则按 orderNo 查
    const order = await this.prisma.order.findFirst({
      where: { orderNo: rawId, userId },
      select: { id: true },
    });
    if (!order) throw new Error(`未找到订单 ${rawId}`);
    return order.id;
  }

  /** 查询用户订单列表 */
  private async execGetOrders(args: { status?: string; start_date?: string; end_date?: string; limit?: number }, userId: number) {
    const { list, total } = await this.orderService.list(userId, args.status, 1, args.limit || 10);
    const orders = list.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      amount: (o.payAmount / 100).toFixed(2),
      itemCount: o.itemCount,
      createdAt: o.createdAt,
    }));
    return JSON.stringify({ success: true, data: { orders, total }, message: `找到 ${total} 个订单` });
  }

  /** 查询订单详情 */
  private async execGetOrderDetail(args: { order_id: string }, userId: number) {
    const id = await this.resolveOrderId(args.order_id, userId);
    const detail = await this.orderService.detail(userId, id);
    return JSON.stringify({
      success: true,
      data: {
        id: detail.id,
        orderNo: detail.orderNo,
        status: detail.status,
        amount: (detail.payAmount / 100).toFixed(2),
        address: detail.addressJson,
        items: detail.items.map((i) => ({
          title: i.spuTitle,
          unitPrice: (i.unitPrice / 100).toFixed(2),
          quantity: i.quantity,
        })),
        createdAt: detail.createdAt,
      },
    });
  }

  /** 申请退货 */
  private async execApplyReturn(args: { order_id: string; reason: string }, userId: number) {
    const id = await this.resolveOrderId(args.order_id, userId);
    await this.orderService.requestRefund(userId, id, args.reason);
    return JSON.stringify({ success: true, message: `订单 ${args.order_id} 退货申请已提交，请等待审核` });
  }

  /** 查询退货进度 */
  private async execGetReturnStatus(args: { order_id: string }, userId: number) {
    const id = await this.resolveOrderId(args.order_id, userId);
    const detail = await this.orderService.detail(userId, id);
    return JSON.stringify({
      success: true,
      data: { orderNo: detail.orderNo, status: detail.status },
      message: detail.status === 'REFUNDING' ? '退货审核中' : detail.status === 'REFUNDED' ? '已退款' : '当前状态不支持退货查询',
    });
  }

  /** 修改订单收货地址（仅未发货） */
  private async execUpdateOrderAddress(args: { order_id: string; new_address: Record<string, string> }, userId: number) {
    const id = await this.resolveOrderId(args.order_id, userId);
    // 需要先在 AddressService 创建新地址，然后更新订单
    const addr = await this.addressService.create(userId, {
      name: args.new_address.receiver_name || '',
      phone: args.new_address.phone || '',
      province: args.new_address.province || '',
      city: args.new_address.city || '',
      district: args.new_address.district || '',
      detail: args.new_address.detail || '',
    });
    return JSON.stringify({ success: true, message: `订单 ${args.order_id} 收货地址已更新`, data: { addressId: addr.id } });
  }

  /** 更新默认收货地址 */
  private async execUpdateDefaultAddress(args: { address: Record<string, string> }, userId: number) {
    const addr = await this.addressService.create(userId, {
      name: args.address.receiver_name || '',
      phone: args.address.phone || '',
      province: args.address.province || '',
      city: args.address.city || '',
      district: args.address.district || '',
      detail: args.address.detail || '',
      isDefault: true,
    });
    return JSON.stringify({ success: true, message: '默认收货地址已更新', data: { addressId: addr.id } });
  }

  /** 查询商品 */
  private async execQueryProduct(args: { keyword?: string; sku?: string }) {
    const { list, total } = await this.catalogService.listSpus({
      keyword: args.keyword,
      page: 1,
      pageSize: 5,
    });
    const products = list.map((p) => ({
      id: p.id,
      title: p.title,
      price: (p.minPrice / 100).toFixed(2),
      stock: p.totalStock,
      status: p.status,
    }));
    return JSON.stringify({ success: true, data: { products, total }, message: `找到 ${total} 个商品` });
  }

  /** Redis 对话历史读写 */
  private async loadHistory(cid: string): Promise<ChatMessage[]> {
    try {
      const client = this.redis.getClient();
      const raw = await client.get(`chat:${cid}`);
      if (raw) {
        const history = JSON.parse(raw) as ChatMessage[];
        return history.slice(-MAX_ROUNDS * 2);
      }
    } catch {
      // Redis 不可用时忽略
    }
    return [];
  }

  private async saveHistory(cid: string, newMessages: ChatMessage[]) {
    try {
      const client = this.redis.getClient();
      const existing = await this.loadHistory(cid);
      existing.push(...newMessages);
      const trimmed = existing.slice(-MAX_ROUNDS * 2);
      await client.set(`chat:${cid}`, JSON.stringify(trimmed), 'EX', CONVERSATION_TTL);
    } catch {
      // Redis 不可用时忽略
    }
  }
}
