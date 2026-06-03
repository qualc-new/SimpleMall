import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';
import { http } from '../../services/http';

interface OrderRow {
  id: number;
  orderNo: string;
  status: string;
  payAmount: number;
  userId: number;
}

export default function OrderListPage() {
  const [list, setList] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>('PAID');
  const [shipModal, setShipModal] = useState<number | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<{ list: OrderRow[] }>('/admin/orders', { params: { status, pageSize: 50 } });
      setList(data.list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const ship = async () => {
    const v = await form.validateFields();
    await http.patch(`/admin/orders/${shipModal}/ship`, v);
    message.success('已发货');
    setShipModal(null);
    load();
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag>{ORDER_STATUS_LABEL[s as OrderStatus] ?? s}</Tag>,
    },
    { title: '金额(分)', dataIndex: 'payAmount' },
    {
      title: '操作',
      render: (_: unknown, row: OrderRow) => (
        <Space>
          <Link to={`/orders/${row.id}`}>详情</Link>
          {row.status === 'PAID' && (
            <Button size="small" onClick={() => { setShipModal(row.id); form.resetFields(); }}>
              发货
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Select
        style={{ width: 160, marginBottom: 16 }}
        allowClear
        placeholder="状态筛选"
        value={status}
        onChange={setStatus}
        options={Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
      />
      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} />
      <Modal title="发货" open={!!shipModal} onOk={ship} onCancel={() => setShipModal(null)}>
        <Form form={form} layout="vertical">
          <Form.Item name="company" label="物流公司" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="trackingNo" label="运单号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
