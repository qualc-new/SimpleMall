import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { TagStatus, TAG_STATUS_LABEL } from '@simplemall/shared';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';

interface ServiceRow {
  id: number;
  name: string;
  status: string;
  sort: number;
}

/** 服务保障管理：与商品表单【服务保障】字段联动，C 端详情页展示 */
export default function ServiceGuaranteeListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<ServiceRow[]>('/admin/service-guarantees');
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
    form.setFieldsValue({ status: TagStatus.ENABLED, sort: 0 });
    setOpen(true);
  };

  const openEdit = (row: ServiceRow) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, status: row.status, sort: row.sort });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      await http.put(`/admin/service-guarantees/${editing.id}`, v);
    } else {
      await http.post('/admin/service-guarantees', v);
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        title="服务保障"
        description="维护商品详情页展示的服务保障项；仅「启用」项可选入商品。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增保障
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
          { title: '名称', dataIndex: 'name' },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s: string) => (
              <Tag color={s === TagStatus.ENABLED ? 'success' : 'default'}>
                {TAG_STATUS_LABEL[s as TagStatus] ?? s}
              </Tag>
            ),
          },
          { title: '排序', dataIndex: 'sort', width: 88 },
          {
            title: '操作',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除该保障项？"
                  description="未被任何商品引用方可删除"
                  onConfirm={async () => {
                    await http.delete(`/admin/service-guarantees/${row.id}`);
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
        title={editing ? '编辑服务保障' : '新增服务保障'}
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：破损包退" maxLength={64} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={Object.values(TagStatus).map((v) => ({
                value: v,
                label: TAG_STATUS_LABEL[v],
              }))}
            />
          </Form.Item>
          <Form.Item name="sort" label="排序权重" extra="数值越大越靠前">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
