import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd';
import { TagStatus, TAG_STATUS_LABEL } from '@simplemall/shared';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';

interface TagRow {
  id: number;
  name: string;
  status: string;
  isHot: boolean;
}

/** 标签管理：与商品表单【标签】字段联动 */
export default function TagListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TagRow | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<TagRow[]>('/admin/tags');
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
    form.setFieldsValue({ status: TagStatus.ENABLED, isHot: false });
    setOpen(true);
  };

  const openEdit = (row: TagRow) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, status: row.status, isHot: row.isHot });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      await http.put(`/admin/tags/${editing.id}`, v);
    } else {
      await http.post('/admin/tags', v);
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        title="标签管理"
        description="维护商品标签；仅「启用」标签可选入商品，「热门」标签展示在商城顶部。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增标签
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
          {
            title: '热门标签',
            dataIndex: 'isHot',
            width: 100,
            render: (v: boolean) => (v ? <Tag color="volcano">是</Tag> : '否'),
          },
          {
            title: '操作',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除该标签？"
                  description="未被任何商品引用方可删除"
                  onConfirm={async () => {
                    await http.delete(`/admin/tags/${row.id}`);
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
        title={editing ? '编辑标签' : '新增标签'}
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="例如：新品" maxLength={64} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={Object.values(TagStatus).map((v) => ({
                value: v,
                label: TAG_STATUS_LABEL[v],
              }))}
            />
          </Form.Item>
          <Form.Item name="isHot" label="热门标签" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
