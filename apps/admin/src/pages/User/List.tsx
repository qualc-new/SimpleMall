import { SearchOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { httpV2 } from '../../services/httpV2';

type UserRow = {
  id: number;
  phone: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { orders: number; addresses: number };
};

type UserListRes = {
  list: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** 商城用户管理（调用 API v2） */
export default function UserListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form] = Form.useForm();

  const load = async (p = page, ps = pageSize, kw = keyword) => {
    setLoading(true);
    try {
      const { data } = await httpV2.get<UserListRes>('/admin/users', {
        params: { page: p, pageSize: ps, keyword: kw || undefined },
      });
      setList(data.list);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (row: UserRow) => {
    setEditing(row);
    form.setFieldsValue({ nickname: row.nickname ?? '' });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const v = await form.validateFields();
    await httpV2.put(`/admin/users/${editing.id}`, { nickname: v.nickname || null });
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        title="商城用户"
        description="管理 C 端注册用户（接口前缀 /api/v2）。"
        extra={
          <Space>
            <Input
              allowClear
              placeholder="手机号 / 昵称"
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => load(1, pageSize, keyword)}
            />
            <Button icon={<SearchOutlined />} onClick={() => load(1, pageSize, keyword)}>
              搜索
            </Button>
          </Space>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => load(p, ps, keyword),
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 72 },
          { title: '手机号', dataIndex: 'phone', width: 140 },
          {
            title: '昵称',
            dataIndex: 'nickname',
            render: (v: string | null) => v || '—',
          },
          {
            title: '订单数',
            width: 88,
            render: (_, row) => row._count.orders,
          },
          {
            title: '地址数',
            width: 88,
            render: (_, row) => row._count.addresses,
          },
          {
            title: '注册时间',
            dataIndex: 'createdAt',
            width: 180,
            render: (v: string) => new Date(v).toLocaleString(),
          },
          {
            title: '操作',
            width: 100,
            render: (_, row) => (
              <Button type="link" size="small" onClick={() => openEdit(row)}>
                编辑
              </Button>
            ),
          },
        ]}
      />
      <Modal title="编辑用户" open={open} onOk={save} onCancel={() => setOpen(false)} destroyOnClose>
        <p className="text-gray-500 text-sm mb-3">手机号：{editing?.phone}</p>
        <Form form={form} layout="vertical">
          <Form.Item name="nickname" label="昵称">
            <Input maxLength={64} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
