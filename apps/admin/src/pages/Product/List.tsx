import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  StockOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Dropdown,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpuStatus, SPU_STATUS_LABEL } from '@simplemall/shared';
import PageHeader from '../../components/PageHeader';
import { SPU_STATUS_OPTIONS, SpuStatusTag } from '../../constants/status';
import { http } from '../../services/http';
import { formatPrice, formatSpecs } from '../../utils/format';
import { spuPriceRange } from '../../utils/spuList';

const STORE_BASE = import.meta.env.VITE_STORE_URL || 'http://localhost:3000';

interface Sku {
  id: number;
  stock: number;
  reserved?: number;
  price: number;
  specsJson: Record<string, string>;
  status?: string;
}

interface SpuRow {
  id: number;
  goodsSn?: string | null;
  title: string;
  subtitle?: string;
  status: string;
  mainImage: string;
  totalStock?: number;
  saleNum?: number;
  sort?: number;
  isNew?: boolean;
  isHot?: boolean;
  isRecommend?: boolean;
  putawayTime?: string | null;
  updatedAt?: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  skus: Sku[];
}

interface Category {
  id: number;
  name: string;
  level: number;
}

interface Brand {
  id: number;
  name: string;
}

interface ListQuery {
  page: number;
  pageSize: number;
  status?: string;
  categoryId?: number;
  brandId?: number;
  keyword?: string;
}

interface StockTarget {
  skuId: number;
  label: string;
  stock: number;
}

/** 管理端商品列表：筛选、分页、SKU 展开、库存与状态快捷操作 */
export default function ProductListPage() {
  const { message } = App.useApp();
  const [list, setList] = useState<SpuRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState<ListQuery>({ page: 1, pageSize: 10 });
  const [keywordInput, setKeywordInput] = useState('');
  const [stockTarget, setStockTarget] = useState<StockTarget | null>(null);
  const [stockMode, setStockMode] = useState<'set' | 'delta'>('set');
  const [stockForm] = Form.useForm();

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.level === 2 ? `└ ${c.name}` : c.name,
      })),
    [categories],
  );

  const loadMeta = useCallback(async () => {
    const [catRes, brandRes] = await Promise.all([
      http.get<Category[]>('/admin/categories'),
      http.get<Brand[]>('/admin/brands'),
    ]);
    setCategories(catRes.data);
    setBrands(brandRes.data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<{ list: SpuRow[]; total: number; page: number; pageSize: number }>(
        '/admin/spus',
        {
          params: {
            page: query.page,
            pageSize: query.pageSize,
            status: query.status,
            categoryId: query.categoryId,
            brandId: query.brandId,
            keyword: query.keyword,
          },
        },
      );
      setList(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    load();
  }, [load]);

  const applyKeyword = () => {
    setQuery((q) => ({ ...q, page: 1, keyword: keywordInput.trim() || undefined }));
  };

  const resetFilters = () => {
    setKeywordInput('');
    setQuery({ page: 1, pageSize: 10 });
  };

  const patchStatus = async (id: number, status: SpuStatus) => {
    await http.patch(`/admin/spus/${id}/status`, { status });
    message.success(`已设为「${SPU_STATUS_LABEL[status]}」`);
    load();
  };

  const openStockModal = (sku: Sku) => {
    setStockTarget({
      skuId: sku.id,
      label: formatSpecs(sku.specsJson) || `SKU #${sku.id}`,
      stock: sku.stock,
    });
    setStockMode('set');
    stockForm.setFieldsValue({ mode: 'set', stock: sku.stock, delta: 0 });
  };

  const saveStock = async () => {
    if (!stockTarget) return;
    const v = await stockForm.validateFields();
    if (v.mode === 'set') {
      await http.patch(`/admin/skus/${stockTarget.skuId}/stock`, { stock: v.stock });
    } else {
      await http.patch(`/admin/skus/${stockTarget.skuId}/stock`, { delta: v.delta });
    }
    message.success('库存已更新');
    setStockTarget(null);
    load();
  };

  const statusMenuItems = (row: SpuRow): MenuProps['items'] =>
    SPU_STATUS_OPTIONS.map((opt) => ({
      key: opt.value,
      label:
        row.status === opt.value ? (
          <span style={{ color: '#1677ff' }}>{opt.label}（当前）</span>
        ) : (
          opt.label
        ),
      disabled: row.status === opt.value,
      onClick: () => patchStatus(row.id, opt.value as SpuStatus),
    }));

  const skuColumns: ColumnsType<Sku> = [
    { title: 'SKU ID', dataIndex: 'id', width: 80 },
    {
      title: '规格',
      dataIndex: 'specsJson',
      render: (specs: Record<string, string>) => formatSpecs(specs) || '默认',
    },
    {
      title: '售价',
      dataIndex: 'price',
      width: 100,
      render: (p: number) => formatPrice(p),
    },
    {
      title: '库存',
      width: 120,
      render: (_: unknown, sku: Sku) => (
        <span>
          {sku.stock}
          {(sku.reserved ?? 0) > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {' '}
              (预占 {sku.reserved})
            </Typography.Text>
          )}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (s: string) =>
        s === 'DISABLED' ? <Tag>已禁用</Tag> : <Tag color="success">启用</Tag>,
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, sku: Sku) =>
        sku.status !== 'DISABLED' ? (
          <Button type="link" size="small" icon={<StockOutlined />} onClick={() => openStockModal(sku)}>
            调库存
          </Button>
        ) : (
          '—'
        ),
    },
  ];

  const columns: ColumnsType<SpuRow> = [
    { title: 'ID', dataIndex: 'id', width: 64, fixed: 'left' },
    {
      title: '商品',
      key: 'product',
      width: 280,
      render: (_: unknown, row: SpuRow) => (
        <div className="product-cell">
          <Image
            src={row.mainImage}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f5f5f5' width='48' height='48'/%3E%3C/svg%3E"
          />
          <div className="product-cell__body">
            <div className="product-cell__title">{row.title}</div>
            <div className="product-cell__meta">
              {row.category?.name ?? '—'}
              {row.brand?.name ? ` · ${row.brand.name}` : ''}
            </div>
            {(row.isNew || row.isHot || row.isRecommend) && (
              <Space size={4} className="product-cell__tags">
                {row.isNew && <Tag color="green">新品</Tag>}
                {row.isHot && <Tag color="volcano">热销</Tag>}
                {row.isRecommend && <Tag color="blue">推荐</Tag>}
              </Space>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '货号',
      dataIndex: 'goodsSn',
      width: 120,
      render: (v: string | null) =>
        v ? (
          <Space size={4}>
            <Typography.Text copyable={{ text: v }} style={{ fontSize: 13 }}>
              {v}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '售价',
      key: 'price',
      width: 110,
      render: (_: unknown, row: SpuRow) => {
        const range = spuPriceRange(row.skus ?? []);
        if (range === '—') return '—';
        const parts = range.split('~').map(Number);
        if (parts.length === 1) return formatPrice(parts[0]);
        return `${formatPrice(parts[0])} ~ ${formatPrice(parts[1])}`;
      },
    },
    {
      title: '总库存',
      dataIndex: 'totalStock',
      width: 80,
      render: (v: number | undefined, row) => {
        const stock = v ?? 0;
        const warn = row.skus?.some((s) => s.status !== 'DISABLED' && s.stock <= 10);
        return warn ? <Typography.Text type="danger">{stock}</Typography.Text> : stock;
      },
    },
    { title: '销量', dataIndex: 'saleNum', width: 72, render: (v?: number) => v ?? 0 },
    { title: '排序', dataIndex: 'sort', width: 64, render: (v?: number) => v ?? 0 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (s: string) => <SpuStatusTag status={s} />,
    },
    {
      title: 'SKU',
      key: 'skuCount',
      width: 72,
      render: (_: unknown, row: SpuRow) => {
        const enabled = row.skus?.filter((s) => s.status !== 'DISABLED').length ?? 0;
        return `${enabled} 个`;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: unknown, row: SpuRow) => (
        <Space size={0} wrap>
          <Tooltip title="C 端预览">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(`${STORE_BASE}/products/${row.id}`, '_blank')}
            />
          </Tooltip>
          <Link to={`/products/${row.id}/edit`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          {row.status !== SpuStatus.ON_SALE && (
            <Popconfirm
              title="确认上架？"
              description="有库存时将展示为已上架，无库存则为已售罄"
              onConfirm={() => patchStatus(row.id, SpuStatus.ON_SALE)}
            >
              <Button type="link" size="small">
                上架
              </Button>
            </Popconfirm>
          )}
          {row.status !== SpuStatus.OFF_SALE && (
            <Popconfirm title="确认下架？C 端将不可见" onConfirm={() => patchStatus(row.id, SpuStatus.OFF_SALE)}>
              <Button type="link" size="small" danger>
                下架
              </Button>
            </Popconfirm>
          )}
          <Dropdown menu={{ items: statusMenuItems(row) }} trigger={['click']}>
            <Button type="link" size="small">
              更多状态
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setQuery((q) => ({
      ...q,
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }));
  };

  return (
    <>
      <PageHeader
        title="商品列表"
        description="筛选、分页浏览 SPU；展开查看 SKU，快捷上下架与调库存。"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
            <Link to="/products/new">
              <Button type="primary" icon={<PlusOutlined />}>
                发布商品
              </Button>
            </Link>
          </Space>
        }
      />

      <div className="admin-content__card product-list-toolbar">
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="名称 / 货号 / 卖点"
            style={{ width: 220 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onSearch={applyKeyword}
            onPressEnter={applyKeyword}
          />
          <Select
            allowClear
            placeholder="商品状态"
            style={{ width: 140 }}
            value={query.status}
            onChange={(status) => setQuery((q) => ({ ...q, page: 1, status }))}
            options={SPU_STATUS_OPTIONS}
          />
          <Select
            allowClear
            placeholder="类目"
            style={{ width: 160 }}
            showSearch
            optionFilterProp="label"
            value={query.categoryId}
            onChange={(categoryId) => setQuery((q) => ({ ...q, page: 1, categoryId }))}
            options={categoryOptions}
          />
          <Select
            allowClear
            placeholder="品牌"
            style={{ width: 140 }}
            showSearch
            optionFilterProp="label"
            value={query.brandId}
            onChange={(brandId) => setQuery((q) => ({ ...q, page: 1, brandId }))}
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Button onClick={resetFilters}>重置</Button>
        </Space>

        <Table<SpuRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1200 }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={onTableChange}
          expandable={{
            expandedRowRender: (row) => (
              <Table<Sku>
                size="small"
                rowKey="id"
                columns={skuColumns}
                dataSource={row.skus ?? []}
                pagination={false}
              />
            ),
            rowExpandable: (row) => (row.skus?.length ?? 0) > 0,
          }}
        />
      </div>

      <Modal
        title="调整库存"
        open={!!stockTarget}
        onOk={saveStock}
        onCancel={() => setStockTarget(null)}
        destroyOnClose
      >
        {stockTarget && (
          <>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {stockTarget.label} · 当前库存 {stockTarget.stock}
            </Typography.Paragraph>
            <Form form={stockForm} layout="vertical" initialValues={{ mode: 'set', stock: stockTarget.stock, delta: 0 }}>
              <Form.Item name="mode" label="调整方式">
                <Radio.Group
                  onChange={(e) => setStockMode(e.target.value)}
                >
                  <Radio value="set">设为指定数量</Radio>
                  <Radio value="delta">增减数量</Radio>
                </Radio.Group>
              </Form.Item>
              {stockMode === 'set' ? (
                <Form.Item name="stock" label="库存" rules={[{ required: true, message: '请输入库存' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="delta"
                  label="增减（可为负数）"
                  rules={[{ required: true, message: '请输入增减数量' }]}
                >
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              )}
            </Form>
          </>
        )}
      </Modal>
    </>
  );
}
