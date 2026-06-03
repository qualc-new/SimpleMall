import { ArrowLeftOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Space, Table, Timeline, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';
import PageHeader from '../../components/PageHeader';
import { OrderStatusTag } from '../../constants/status';
import { http } from '../../services/http';
import { formatPrice } from '../../utils/format';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { message } = App.useApp();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    http
      .get(`/admin/orders/${id}`)
      .then((r) => setOrder(r.data as Record<string, unknown>))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!order && loading) return null;
  if (!order) return <Typography.Text type="secondary">订单不存在</Typography.Text>;

  const status = order.status as string;
  const items = (order.items as Array<Record<string, unknown>>) || [];
  const logs = (order.statusLogs as Array<{ toStatus: string; createdAt: string; operator?: string }>) || [];
  const address = order.addressJson as Record<string, string> | undefined;

  const refund = async (approve: boolean) => {
    await http.patch(`/admin/orders/${id}/refund`, { approve });
    message.success(approve ? '已同意退货' : '已拒绝');
    load();
  };

  return (
    <>
      <PageHeader
        title={`订单 ${order.orderNo as string}`}
        extra={
          <Link to="/orders">
            <Button icon={<ArrowLeftOutlined />}>返回列表</Button>
          </Link>
        }
      />
      <Descriptions bordered column={2} size="middle" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="状态">
          <OrderStatusTag status={status} />
        </Descriptions.Item>
        <Descriptions.Item label="实付金额">{formatPrice(order.payAmount as number)}</Descriptions.Item>
        <Descriptions.Item label="用户 ID">{order.userId as number}</Descriptions.Item>
        <Descriptions.Item label="下单时间">{(order.createdAt as string)?.slice(0, 19) ?? '—'}</Descriptions.Item>
        {address && (
          <Descriptions.Item label="收货地址" span={2}>
            {address.name} {address.phone} · {address.province}
            {address.city}
            {address.district} {address.detail}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Card title="商品明细" size="small" style={{ marginBottom: 24 }}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={items}
          columns={[
            { title: '商品', dataIndex: 'spuTitle' },
            {
              title: '规格',
              dataIndex: 'specsJson',
              render: (s: Record<string, string>) =>
                Object.entries(s || {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' / '),
            },
            { title: '单价', dataIndex: 'unitPrice', render: (v: number) => formatPrice(v) },
            { title: '数量', dataIndex: 'quantity', width: 80 },
          ]}
        />
      </Card>

      <Card title="状态流转" size="small" style={{ marginBottom: 24 }}>
        <Timeline
          items={logs.map((l) => ({
            children: (
              <>
                <Typography.Text type="secondary">{l.createdAt}</Typography.Text>
                <br />
                {ORDER_STATUS_LABEL[l.toStatus as OrderStatus] ?? l.toStatus}
                {l.operator ? ` · ${l.operator}` : ''}
              </>
            ),
          }))}
        />
      </Card>

      {status === 'REFUNDING' && (
        <Space>
          <Button type="primary" onClick={() => refund(true)}>
            同意退货
          </Button>
          <Button onClick={() => refund(false)}>拒绝退货</Button>
        </Space>
      )}
    </>
  );
}
