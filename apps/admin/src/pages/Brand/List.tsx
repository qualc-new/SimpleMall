import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';

interface Brand {
  id: number;
  name: string;
}

/** 品牌管理（与商品表单联动） */
export default function BrandListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Brand[]>('/admin/brands');
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Brand) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      await http.put(`/admin/brands/${editing.id}`, { name: v.name });
    } else {
      await http.post('/admin/brands', { name: v.name });
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        title="品牌管理"
        description="维护商品品牌，发布/编辑商品时可选择。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增品牌
          </Button>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 72 },
          { title: '品牌名称', dataIndex: 'name' },
          {
            title: '操作',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除该品牌？"
                  description="品牌下不能有商品"
                  onConfirm={async () => {
                    await http.delete(`/admin/brands/${row.id}`);
                    message.success('已删除');
                    load();
                  }}
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? '编辑品牌' : '新增品牌'}
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="品牌名称" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="例如：简约造物" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
