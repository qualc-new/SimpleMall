import { Button, Form, Input, InputNumber, Modal, Popconfirm, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { http } from '../../services/http';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  sort: number;
}

export default function CategoryListPage() {
  const [list, setList] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const load = () => http.get<Category[]>('/admin/categories').then((r) => setList(r.data));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const v = await form.validateFields();
    if (editing) {
      await http.put(`/admin/categories/${editing.id}`, v);
    } else {
      await http.post('/admin/categories', v);
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <Button type="primary" className="mb-3" onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
        新增类目
      </Button>
      <Table
        rowKey="id"
        dataSource={list}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: '名称', dataIndex: 'name' },
          { title: '父级', dataIndex: 'parentId' },
          { title: '排序', dataIndex: 'sort' },
          {
            title: '操作',
            render: (_, row) => (
              <>
                <Button type="link" onClick={() => { setEditing(row); form.setFieldsValue(row); setOpen(true); }}>
                  编辑
                </Button>
                <Popconfirm title="确定删除？" onConfirm={() => http.delete(`/admin/categories/${row.id}`).then(load)}>
                  <Button type="link" danger>删除</Button>
                </Popconfirm>
              </>
            ),
          },
        ]}
      />
      <Modal title={editing ? '编辑类目' : '新增类目'} open={open} onOk={save} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="父类目 ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
