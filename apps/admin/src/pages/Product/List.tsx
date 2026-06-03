import { Button, InputNumber, Modal, Select, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpuStatus } from '@simplemall/shared';
import { http } from '../../services/http';

interface Sku {
  id: number;
  stock: number;
  price: number;
}

interface SpuRow {
  id: number;
  title: string;
  status: string;
  skus: Sku[];
}

export default function ProductListPage() {
  const [list, setList] = useState<SpuRow[]>([]);
  const [skuId, setSkuId] = useState<number | null>(null);
  const [stock, setStock] = useState(0);

  const load = async () => {
    const { data } = await http.get<SpuRow[]>('/admin/spus');
    setList(data);
  };

  useEffect(() => {
    load();
  }, []);

  const saveStock = async () => {
    if (!skuId) return;
    await http.patch(`/admin/skus/${skuId}/stock`, { stock });
    message.success('库存已更新');
    setSkuId(null);
    load();
  };

  const patchStatus = async (id: number, status: SpuStatus) => {
    await http.patch(`/admin/spus/${id}/status`, { status });
    message.success('状态已更新');
    load();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title' },
    { title: '状态', dataIndex: 'status' },
    {
      title: '操作',
      render: (_: unknown, row: SpuRow) => (
        <Space>
          <Link to={`/products/${row.id}/edit`}>编辑</Link>
          <Select
            size="small"
            style={{ width: 100 }}
            value={row.status}
            onChange={(s) => patchStatus(row.id, s as SpuStatus)}
            options={[
              { value: SpuStatus.ON_SALE, label: '上架' },
              { value: SpuStatus.OFF_SALE, label: '下架' },
              { value: SpuStatus.DRAFT, label: '草稿' },
            ]}
          />
        </Space>
      ),
    },
    {
      title: 'SKU',
      render: (_: unknown, row: SpuRow) =>
        row.skus?.map((s) => (
          <div key={s.id}>
            #{s.id} 库存 {s.stock} 价格 {s.price}
            <Button type="link" size="small" onClick={() => { setSkuId(s.id); setStock(s.stock); }}>
              调库存
            </Button>
          </div>
        )),
    },
  ];

  return (
    <>
      <Link to="/products/new">
        <Button type="primary" className="mb-3">发布商品</Button>
      </Link>
      <Table rowKey="id" columns={columns} dataSource={list} />
      <Modal title="调整库存" open={!!skuId} onOk={saveStock} onCancel={() => setSkuId(null)}>
        <InputNumber min={0} style={{ width: '100%' }} value={stock} onChange={(v) => setStock(v ?? 0)} />
      </Modal>
    </>
  );
}
