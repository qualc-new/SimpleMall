import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Image, InputNumber, Modal, Select, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpuStatus } from '@simplemall/shared';
import PageHeader from '../../components/PageHeader';
import { SPU_STATUS_OPTIONS, SpuStatusTag } from '../../constants/status';
import { http } from '../../services/http';
import { formatPrice, formatSpecs } from '../../utils/format';

interface Sku {
  id: number;
  stock: number;
  price: number;
  specsJson: Record<string, string>;
}

interface SpuRow {
  id: number;
  title: string;
  status: string;
  mainImage: string;
  category?: { name: string };
  skus: Sku[];
}

export default function ProductListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<SpuRow[]>([]);
  const [filtered, setFiltered] = useState<SpuRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [skuId, setSkuId] = useState<number | null>(null);
  const [stock, setStock] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get<SpuRow[]>('/admin/spus');
      setList(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!statusFilter) setFiltered(list);
    else setFiltered(list.filter((r) => r.status === statusFilter));
  }, [statusFilter, list]);

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
    { title: 'ID', dataIndex: 'id', width: 72 },
    {
      title: '商品',
      dataIndex: 'title',
      render: (_: unknown, row: SpuRow) => (
        <div className="product-cell">
          <Image
            src={row.mainImage}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f5f5f5' width='48' height='48'/%3E%3C/svg%3E"
          />
          <div>
            <div className="product-cell__title">{row.title}</div>
            <div className="product-cell__meta">{row.category?.name ?? '—'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 108,
      render: (s: string) => <SpuStatusTag status={s} />,
    },
    {
      title: 'SKU',
      render: (_: unknown, row: SpuRow) =>
        row.skus?.map((s) => (
          <div key={s.id} className="sku-line">
            <span>
              #{s.id} {formatSpecs(s.specsJson)} · {formatPrice(s.price)} · 库存 {s.stock}
            </span>
            <Button type="link" size="small" onClick={() => { setSkuId(s.id); setStock(s.stock); }}>
              调库存
            </Button>
          </div>
        )),
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, row: SpuRow) => (
        <Space>
          <Link to={`/products/${row.id}/edit`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Select
            size="small"
            style={{ width: 96 }}
            value={row.status}
            onChange={(s) => patchStatus(row.id, s as SpuStatus)}
            options={SPU_STATUS_OPTIONS}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="商品列表"
        description="管理 SPU 上架状态与 SKU 库存、价格。"
        extra={
          <Link to="/products/new">
            <Button type="primary" icon={<PlusOutlined />}>
              发布商品
            </Button>
          </Link>
        }
      />
      <Select
        allowClear
        placeholder="按状态筛选"
        style={{ width: 160, marginBottom: 16 }}
        value={statusFilter}
        onChange={setStatusFilter}
        options={SPU_STATUS_OPTIONS}
      />
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        scroll={{ x: 960 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal title="调整库存" open={!!skuId} onOk={saveStock} onCancel={() => setSkuId(null)} destroyOnClose>
        <InputNumber min={0} style={{ width: '100%' }} value={stock} onChange={(v) => setStock(v ?? 0)} />
      </Modal>
    </>
  );
}
