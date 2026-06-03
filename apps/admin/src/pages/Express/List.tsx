import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';
import { centToYuan, yuanToCent } from '../../utils/spuForm';
import { formatPrice } from '../../utils/format';

interface ExpressTemplate {
  id: number;
  name: string;
  firstFee: number;
  continueFee: number;
  remark: string;
}

/** 运费模板管理（与商品表单联动） */
export default function ExpressListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<ExpressTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpressTemplate | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<ExpressTemplate[]>('/admin/express-templates');
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

  const openEdit = (row: ExpressTemplate) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      firstFeeYuan: centToYuan(row.firstFee),
      continueFeeYuan: centToYuan(row.continueFee),
      remark: row.remark,
    });
    setOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    const body = {
      name: v.name,
      firstFee: yuanToCent(v.firstFeeYuan) ?? 0,
      continueFee: yuanToCent(v.continueFeeYuan) ?? 0,
      remark: v.remark ?? '',
    };
    if (editing) {
      await http.put(`/admin/express-templates/${editing.id}`, body);
    } else {
      await http.post('/admin/express-templates', body);
    }
    message.success('已保存');
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        title="运费模板"
        description="维护运费规则，商品表单中选择模板 ID。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增模板
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
          { title: '模板名称', dataIndex: 'name' },
          {
            title: '首件运费',
            dataIndex: 'firstFee',
            render: (v: number) => formatPrice(v),
          },
          {
            title: '续件运费',
            dataIndex: 'continueFee',
            render: (v: number) => formatPrice(v),
          },
          { title: '备注', dataIndex: 'remark', ellipsis: true },
          {
            title: '操作',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除该模板？"
                  description="未被商品引用方可删除"
                  onConfirm={async () => {
                    await http.delete(`/admin/express-templates/${row.id}`);
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
        title={editing ? '编辑运费模板' : '新增运费模板'}
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
            <Input placeholder="例如：标准快递" />
          </Form.Item>
          <Form.Item name="firstFeeYuan" label="首件运费(元)" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="continueFeeYuan" label="续件运费(元)" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
