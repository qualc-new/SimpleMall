import { App, Button, Form, Input, Modal, Select, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABEL, OrderStatus } from '@simplemall/shared';
import PageHeader from '../../components/PageHeader';
import { OrderStatusTag } from '../../constants/status';
import { http } from '../../services/http';
import { formatPrice } from '../../utils/format';

interface OrderRow {
  id: number;
  orderNo: string;
  status: string;
  payAmount: number;
  userId: number;
  createdAt?: string;
}

export default function OrderListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>('PAID');
  const [page, setPage] = useState(1);
  const [shipModal, setShipModal] = useState<number | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<{ list: OrderRow[]; total: number }>('/admin/orders', {
        params: { status, page, pageSize: 10 },
      });
      setList(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page]);

  const ship = async () => {
    const v = await form.validateFields();
    await http.patch(`/admin/orders/${shipModal}/ship`, v);
    message.success('已发货');
    setShipModal(null);
    load();
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', ellipsis: true },
    { title: '用户 ID', dataIndex: 'userId', width: 88 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => <OrderStatusTag status={s} />,
    },
    {
      title: '实付金额',
      dataIndex: 'payAmount',
      width: 120,
      render: (v: number) => formatPrice(v),
    },
    {
      title: '操作',
      width: 180,
      render: (_: unknown, row: OrderRow) => (
        <Space>
          <Link to={`/orders/${row.id}`}>详情</Link>
          {row.status === 'PAID' && (
            <Button size="small" type="primary" ghost onClick={() => { setShipModal(row.id); form.resetFields(); }}>
              发货
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="订单列表" description="按状态筛选订单，处理发货与退货。" />
      <Select
        style={{ width: 180, marginBottom: 16 }}
        allowClear
        placeholder="全部状态"
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        options={Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
      />
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          showTotal: (t) => `共 ${t} 笔`,
          onChange: setPage,
        }}
      />
      <Modal title="填写物流信息" open={!!shipModal} onOk={ship} onCancel={() => setShipModal(null)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="company" label="物流公司" rules={[{ required: true, message: '请输入物流公司' }]}>
            <Input placeholder="例如：顺丰速运" />
          </Form.Item>
          <Form.Item name="trackingNo" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}>
            <Input placeholder="物流单号" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
