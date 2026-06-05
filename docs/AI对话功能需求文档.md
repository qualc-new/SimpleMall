```markdown
# AI对话功能需求文档（电商助手）

## 1. 概述

本需求文档定义了一个面向电商场景的AI对话助手，用户可通过自然语言与系统交互，完成订单查询、退货申请、地址修改等常见操作。系统后端基于 **NestJS** 框架，提供工具调用接口；前端基于 **Nuxt** 框架，实现对话界面。大模型默认接入 **DeepSeek V4**，支持配置切换其他兼容模型（如GPT-4、Claude等）。通过函数调用（Function Calling）机制，大模型识别用户意图并调用预设的后端工具，最终执行电商业务逻辑。

## 2. 功能需求

### 2.1 核心对话功能

- 支持文本形式的多轮对话，保留上下文（最近10轮）。
- 用户可输入自然语言指令，AI理解后返回回答或执行操作。
- 对需要权限的操作（查看订单、退货、改地址），需先校验用户登录状态；未登录时引导登录。
- 操作结果（成功/失败）以友好文本返回给用户，必要时附带页面链接（如订单详情）。

### 2.2 电商业务功能（由工具实现）

| 功能             | 描述                                         | 输入示例                           |
| ---------------- | -------------------------------------------- | ---------------------------------- |
| 查看我的订单     | 查询当前用户的订单列表，支持按时间、状态筛选 | “帮我看看最近一个月的订单”         |
| 订单详情         | 查看单个订单的详细信息（商品、金额、物流等） | “订单号ABC123的详情”               |
| 申请退货         | 针对已完成的订单中的商品发起退货申请         | “我要退订单ABC123里的那件T恤”      |
| 查询退货进度     | 查看退货申请的处理状态                       | “我的退货申请处理得怎么样了”       |
| 修改收货地址     | 修改指定订单的收货地址（仅限未发货订单）     | “把订单ABC123的地址改成上海市XX路” |
| 修改个人默认地址 | 更新用户账户的默认收货地址                   | “把我的默认地址改到北京朝阳区XX号” |
| 商品咨询         | 询问商品参数、库存、价格等                   | “这款手机支持5G吗”                 |
| 优惠券查询       | 列出用户可用的优惠券                         | “我有哪些优惠券”                   |

### 2.3 异常处理

- 当模型无法理解用户意图时，回复“抱歉，我没能理解您的问题，您可以尝试描述订单、退货或地址相关操作”。
- 工具执行失败（如订单号不存在、无权限）时，返回明确的错误信息，由模型转述给用户。
- 敏感操作（如退货、改地址）需二次确认：模型先询问用户确认，用户确认后再调用工具。

## 3. 技术架构
```

┌─────────┐ WebSocket/HTTP ┌──────────────┐ HTTP ┌─────────────┐
│ Nuxt │ ◄──────────────────► │ NestJS │ ◄────────► │ DeepSeek V4 │
│ (前端) │ │ (API + 工具层) │ │ (或其它LLM) │
└─────────┘ └──────┬───────┘ └─────────────┘
│
│ 数据库 / 业务服务
▼
┌─────────────┐
│ 电商核心服务 │
│ (订单/退货/ │
│ 地址等) │
└─────────────┘

````

- **前端**: Nuxt 3 + Vue 3，使用 Server-Sent Events 实现流式对话。
- **后端**: NestJS，提供 `/api/chat/completions` 接口，整合大模型函数调用，并实现各个工具的业务逻辑。
- **大模型**: 默认接入 DeepSeek V4（API地址可配置），支持 OpenAI 兼容的 function calling 格式。
- **数据库**: 用于存储对话历史（可选，便于分析）；业务数据由电商核心服务提供（本需求文档假设已有订单/退货/地址服务）。

## 4. 工具定义（供大模型调用）

所有工具均采用 JSON Schema 格式描述。后端需实现对应的工具执行函数。

### 4.1 get_orders
查询当前用户的订单列表。
```json
{
  "name": "get_orders",
  "description": "获取当前登录用户的订单列表，可按状态或时间范围筛选",
  "parameters": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["pending", "paid", "shipped", "completed", "cancelled"],
        "description": "订单状态过滤，可选"
      },
      "start_date": { "type": "string", "format": "date", "description": "开始日期 YYYY-MM-DD" },
      "end_date": { "type": "string", "format": "date", "description": "结束日期 YYYY-MM-DD" },
      "limit": { "type": "integer", "default": 10 }
    }
  }
}
````

### 4.2 get_order_detail

获取单个订单详情。

```json
{
  "name": "get_order_detail",
  "description": "根据订单号获取订单详细信息",
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "订单号" }
    },
    "required": ["order_id"]
  }
}
```

### 4.3 apply_return

申请退货。

```json
{
  "name": "apply_return",
  "description": "为指定订单中的商品提交退货申请",
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string" },
      "product_id": {
        "type": "string",
        "description": "商品ID（订单中可能有多商品）"
      },
      "reason": { "type": "string", "description": "退货原因" },
      "quantity": { "type": "integer", "description": "退货数量" }
    },
    "required": ["order_id", "product_id", "reason"]
  }
}
```

### 4.4 get_return_status

查询退货申请进度。

```json
{
  "name": "get_return_status",
  "description": "查询某个退货申请的状态",
  "parameters": {
    "type": "object",
    "properties": {
      "return_id": {
        "type": "string",
        "description": "退货申请ID（如果用户没有提供，可先调用获取订单退货信息）"
      },
      "order_id": {
        "type": "string",
        "description": "订单号（与return_id二选一）"
      }
    }
  }
}
```

### 4.5 update_order_address

修改指定订单的收货地址（仅限未发货订单）。

```json
{
  "name": "update_order_address",
  "description": "修改尚未发货的订单的收货地址",
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string" },
      "new_address": {
        "type": "object",
        "properties": {
          "receiver_name": { "type": "string" },
          "phone": { "type": "string" },
          "province": { "type": "string" },
          "city": { "type": "string" },
          "district": { "type": "string" },
          "detail": { "type": "string" }
        },
        "required": ["receiver_name", "phone", "detail"]
      }
    },
    "required": ["order_id", "new_address"]
  }
}
```

### 4.6 update_default_address

修改用户的默认收货地址。

```json
{
  "name": "update_default_address",
  "description": "更新当前登录用户的默认收货地址",
  "parameters": {
    "type": "object",
    "properties": {
      "address": {
        "type": "object",
        "properties": {
          "receiver_name": { "type": "string" },
          "phone": { "type": "string" },
          "province": { "type": "string" },
          "city": { "type": "string" },
          "district": { "type": "string" },
          "detail": { "type": "string" }
        },
        "required": ["receiver_name", "phone", "detail"]
      }
    },
    "required": ["address"]
  }
}
```

### 4.7 query_product

查询商品信息（库存、价格、规格）。

```json
{
  "name": "query_product",
  "description": "根据商品名称或SKU查询商品详细信息",
  "parameters": {
    "type": "object",
    "properties": {
      "keyword": { "type": "string", "description": "商品名称或关键词" },
      "sku": { "type": "string", "description": "商品SKU码" }
    }
  }
}
```

### 4.8 get_coupons

查询用户可用优惠券。

```json
{
  "name": "get_coupons",
  "description": "获取当前登录用户的所有可用优惠券列表",
  "parameters": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["available", "used", "expired"],
        "description": "优惠券状态过滤"
      }
    }
  }
}
```

## 5. API 设计（NestJS）

### 5.1 对话接口

**端点**: `POST /api/chat/completions`  
**认证**: Bearer Token（用户登录后获得）  
**请求体**:

```json
{
  "messages": [
    { "role": "user", "content": "帮我查看最近一个月的订单" },
    { "role": "assistant", "content": "好的，正在为您查询..." } // 可省略，由后端维护
  ],
  "conversation_id": "optional-uuid", // 用于维护上下文
  "stream": false // 是否流式返回
}
```

**响应**（非流式）:

```json
{
  "message": { "role": "assistant", "content": "为您找到3个订单：..." },
  "conversation_id": "uuid",
  "tool_calls": [] // 如果需要调试，可返回模型调用的工具
}
```

### 5.2 后端处理流程

1. 接收请求，获取当前用户ID（从Token解析）。
2. 将用户消息与历史上下文（从Redis或数据库读取）组成对话数组。
3. 调用大模型API（DeepSeek V4），同时传入工具定义（tools参数）。
4. 若模型返回`tool_calls`：
   - 根据工具名称调用对应的NestJS服务方法，传入用户ID和参数。
   - 将工具执行结果（字符串）作为`tool`角色的消息追加到对话中。
   - 再次调用大模型，让模型根据工具结果生成最终回复。
5. 将最终回复保存到对话历史，返回给前端。
6. 若模型直接回复文本，则直接返回。

### 5.3 工具内部实现要点

- 所有工具在执行前必须验证用户身份（从上下文获取userId），只允许操作本人数据。
- 业务逻辑调用现有的电商服务模块（订单服务、退货服务、地址服务等）。
- 返回格式应尽量结构化，便于模型转述。例如：
  ```json
  { "success": true, "data": { "orders": [...] }, "message": "查询成功" }
  ```

## 6. 前端集成（Nuxt）

### 6.1 对话组件

- 页面路径：`/chat` 或作为浮窗挂载在全站。
- 组件功能：
  - 消息列表展示用户和AI的对话气泡。
  - 输入框支持文本输入、发送按钮。
  - 显示“正在输入”状态（流式响应时展示逐字效果）。
  - 对于工具操作结果，可附带链接按钮（如“查看订单详情”跳转至`/order/xxx`）。
- 状态管理：使用Pinia存储当前对话ID和最近消息。

### 6.2 API调用封装

创建`composables/useChat.ts`：

```typescript
export const useChat = () => {
  const sendMessage = async (content: string, conversationId?: string) => {
    const { data } = await useFetch("/api/chat/completions", {
      method: "POST",
      body: {
        messages: [{ role: "user", content }],
        conversation_id: conversationId,
      },
    });
    return data.value;
  };
  return { sendMessage };
};
```

### 6.3 用户认证

- 通过`useAuth`组合式函数获取当前用户Token，自动添加到请求头。
- 未登录时，对话助手提示“请先登录”，并提供登录按钮跳转。

### 6.4 增强体验

- 建议采用Server-Sent Events实现流式回复：后端通过`@nestjs/event-emitter`推送文本块，前端使用`EventSource`接收。
- 对于订单、商品等实体，可在回复中使用Markdown格式，并渲染链接。

## 7. 配置说明

### 7.1 大模型配置

通过环境变量配置：

```env
LLM_PROVIDER=deepseek  # 或 openai, custom
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat  # V4对应模型名
# 若使用OpenAI:
OPENAI_API_KEY=xxx
OPENAI_MODEL=gpt-4-turbo
```

NestJS中编写`LlmService`，根据`LLM_PROVIDER`动态加载适配器，统一实现函数调用能力。

### 7.2 对话历史存储

- 可选：使用Redis存储最近10条消息，TTL设为30分钟（用户无活动后清理）。
- 生产环境可持久化到数据库，便于运营分析。

### 7.3 工具开关

可在管理后台动态启用/禁用某些工具（如退货功能暂时关闭），通过配置文件或数据库标志控制。禁用后模型将无法调用对应工具，回复时提示“该功能暂不可用”。

## 8. 非功能需求

- **响应时间**：95%的请求在2秒内返回（不含模型推理时间，模型超时设为15秒）。
- **并发**：支持1000个并发对话。
- **安全性**：防止提示词注入攻击；对工具调用参数进行白名单校验；所有修改操作写日志。
- **可观测性**：记录每次模型调用的token消耗、工具调用次数、错误率；使用OpenTelemetry跟踪。

## 9. 测试用例

| 用户输入                                                 | 预期行为                                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| “我的订单”                                               | 调用`get_orders`，返回最近订单列表               |
| “退货订单123456”                                         | 模型先询问原因，用户回复后调用`apply_return`     |
| “把默认地址改成北京市朝阳区xx路5号，张三收，13800138000” | 调用`update_default_address`，成功则返回修改结果 |
| “今天天气怎么样”                                         | 模型回复“抱歉，我只能帮您处理电商相关问题”       |

## 10. 附录：DeepSeek V4 函数调用示例

请求（模拟）：

```json
{
  "model": "deepseek-chat",
  "messages": [{ "role": "user", "content": "帮我查一下最近的订单" }],
  "tools": [
    /* 上述8个工具定义 */
  ],
  "tool_choice": "auto"
}
```

响应：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "call_123",
            "function": {
              "name": "get_orders",
              "arguments": "{\"limit\":10}"
            }
          }
        ]
      }
    }
  ]
}
```
