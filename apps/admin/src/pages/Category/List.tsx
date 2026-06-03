import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';
import { buildCategoryTree, type Category, type CategoryTreeNode } from '../../utils/categoryTree';

export default function CategoryListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [parentPreset, setParentPreset] = useState<number | null>(null);
  const [form] = Form.useForm();

  const treeData = useMemo(() => buildCategoryTree(list), [list]);

  const nameMap = useMemo(() => new Map(list.map((c) => [c.id, c.name])), [list]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await http.get<Category[]>('/admin/categories');
      setList(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateRoot = () => {
    setEditing(null);
    setParentPreset(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0 });
    setOpen(true);
  };

  const openCreateChild = (parent: Category) => {
    setEditing(null);
    setParentPreset(parent.id);
    form.resetFields();
    form.setFieldsValue({ parentId: parent.id, sort: 0 });
    setOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    setParentPreset(row.parentId);
    form.setFieldsValue({ name: row.name, sort: row.sort });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      await http.put(`/admin/categories/${editing.id}`, { name: v.name, sort: v.sort });
    } else {
      await http.post('/admin/categories', {
        name: v.name,
        sort: v.sort ?? 0,
        parentId: v.parentId ?? undefined,
      });
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  const parentOptions = list
    .filter((c) => c.level === 1)
    .map((c) => ({ value: c.id, label: c.name }));

  const columns: ColumnsType<CategoryTreeNode> = [
    {
      title: '类目名称',
      dataIndex: 'name',
      render: (name: string, row) => (
        <Space>
          <span style={{ fontWeight: row.level === 1 ? 600 : 400 }}>{name}</span>
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>ID {row.id}</span>
        </Space>
      ),
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 96,
      render: (l: number) => <Tag color={l === 1 ? 'blue' : 'geekblue'}>{l === 1 ? '一级' : '二级'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '操作',
      width: 240,
      render: (_, row) => (
        <Space size={0} wrap>
          {row.level === 1 && (
            <Button type="link" size="small" onClick={() => openCreateChild(row)}>
              新增子类目
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该类目？"
            description="类目下不能有子类目或商品"
            onConfirm={async () => {
              await http.delete(`/admin/categories/${row.id}`);
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
  ];

  const modalTitle = editing
    ? '编辑类目'
    : parentPreset
      ? `新增子类目（父级：${nameMap.get(parentPreset) ?? parentPreset}）`
      : '新增一级类目';

  return (
    <>
      <PageHeader
        title="类目管理"
        description="树形维护商品分类，支持一级类目与二级子类目。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRoot}>
            新增一级类目
          </Button>
        }
      />
      <Table<CategoryTreeNode>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={treeData}
        pagination={false}
        defaultExpandAllRows
        indentSize={24}
      />
      <Modal title={modalTitle} open={open} onOk={save} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入类目名称' }]}>
            <Input placeholder="例如：男装" />
          </Form.Item>
          {!editing && (
            <Form.Item name="parentId" label="父类目">
              <Select
                allowClear
                placeholder="留空为一级类目"
                options={parentOptions}
                disabled={parentPreset != null}
              />
            </Form.Item>
          )}
          {editing && editing.parentId && (
            <Form.Item label="父类目">
              <Input disabled value={nameMap.get(editing.parentId) ?? editing.parentId} />
            </Form.Item>
          )}
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
