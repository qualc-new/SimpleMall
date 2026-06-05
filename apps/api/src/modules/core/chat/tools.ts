/** AI 工具定义（供 Function Calling 使用） */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * 全部工具列表。
 *
 * 工具说明（中文）供 LLM 理解意图：
 * - get_orders：查询当前用户的订单列表，可按状态或时间范围筛选
 * - get_order_detail：根据订单号查询订单详情
 * - apply_return：为指定订单提交退货申请（含原因）
 * - get_return_status：查询订单退货/退款状态
 * - update_order_address：修改未发货订单的收货地址
 * - update_default_address：更新用户默认收货地址
 * - query_product：通过关键词搜索商品
 * - get_coupons：查询可用优惠券（暂未实现）
 */
export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_orders',
      description: '获取当前登录用户的订单列表，可按状态或时间范围筛选',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING_PAY', 'PAID', 'SHIPPED', 'CANCELLED', 'COMPLETED', 'REFUNDING', 'REFUNDED'],
            description: '订单状态过滤，可选',
          },
          start_date: { type: 'string', description: '开始日期 YYYY-MM-DD' },
          end_date: { type: 'string', description: '结束日期 YYYY-MM-DD' },
          limit: { type: 'integer', description: '返回条数，默认10' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_detail',
      description: '根据订单号（形如 SM开头 的字符串）或数字订单ID获取详细信息（商品、金额、物流等）。当用户提供的是 orderNo 格式时直接传入，无需转换',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: '订单号（如 SM178056362339531）或订单数字ID' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_return',
      description: '为指定订单提交退货/退款申请。order_id 可以是订单号（SM开头）或数字ID',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: '订单号（如 SM178056362339531）或数字ID' },
          reason: { type: 'string', description: '退货原因' },
        },
        required: ['order_id', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_return_status',
      description: '查询订单退货/退款的处理状态。order_id 可以是订单号（SM开头）或数字ID',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: '订单号（如 SM178056362339531）或数字ID' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_order_address',
      description: '修改尚未发货的订单的收货地址。order_id 可以是订单号（SM开头）或数字ID',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: '订单号（如 SM178056362339531）或数字ID' },
          new_address: {
            type: 'object',
            properties: {
              receiver_name: { type: 'string', description: '收件人姓名' },
              phone: { type: 'string', description: '收件人电话' },
              province: { type: 'string' },
              city: { type: 'string' },
              district: { type: 'string' },
              detail: { type: 'string', description: '详细地址' },
            },
            required: ['receiver_name', 'phone', 'detail'],
          },
        },
        required: ['order_id', 'new_address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_default_address',
      description: '更新当前登录用户的默认收货地址',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              receiver_name: { type: 'string', description: '收件人姓名' },
              phone: { type: 'string', description: '收件人电话' },
              province: { type: 'string' },
              city: { type: 'string' },
              district: { type: 'string' },
              detail: { type: 'string', description: '详细地址' },
            },
            required: ['receiver_name', 'phone', 'detail'],
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_product',
      description: '根据商品名称或关键词搜索商品信息（价格、库存等）',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '商品名称或关键词' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_coupons',
      description: '获取当前登录用户的所有可用优惠券列表',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['available', 'used', 'expired'],
            description: '优惠券状态过滤',
          },
        },
      },
    },
  },
];
