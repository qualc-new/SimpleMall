import { Button, Card, Descriptions, Space, Tag, Timeline, message } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';
import { http } from '../../services/http';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  const load = () => {
    http.get(`/admin/orders/${id}`).then((r) => setOrder(r.data as Record<string, unknown>));
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!order) return null;

  const status = order.status as string;
  const items = (order.items as Array<Record<string, unknown>>) || [];
  const logs = (order.statusLogs as Array<{ toStatus: string; createdAt: string; operator?: string }>) || [];

  const refund = async (approve: boolean) => {
    await http.patch(`/admin/orders/${id}/refund`, { approve });
    message.success(approve ? '已同意退货' : '已拒绝');
    load();
  };

  return (
    <Card title={`订单 ${order.orderNo as string}`}>
      <Descriptions column={2}>
        <Descriptions.Item label="状态">
          <Tag>{ORDER_STATUS_LABEL[status as OrderStatus] ?? status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="金额(分)">{order.payAmount as number}</Descriptions.Item>
      </Descriptions>
      <h4 className="mt-4">商品</h4>
      <ul>
        {items.map((it) => (
          <li key={it.id as number}>
            {it.spuTitle as string} × {it.quantity as number}
          </li>
        ))}
      </ul>
      <h4 className="mt-4">状态流转</h4>
      <Timeline
        items={logs.map((l) => ({
          children: `${l.createdAt} ${ORDER_STATUS_LABEL[l.toStatus as OrderStatus] ?? l.toStatus} (${l.operator || ''})`,
        }))}
      />
      {status === 'REFUNDING' && (
        <Space className="mt-4">
          <Button type="primary" onClick={() => refund(true)}>
            同意退货
          </Button>
          <Button onClick={() => refund(false)}>拒绝</Button>
        </Space>
      )}
    </Card>
  );
}
