import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Select, Space } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SpuStatus } from '@simplemall/shared';
import SpecMatrixEditor, { SkuRow } from '../../components/SpecMatrixEditor';
import PageHeader from '../../components/PageHeader';
import { SPU_STATUS_OPTIONS } from '../../constants/status';
import { http } from '../../services/http';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
}

export default function SpuFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [specNames, setSpecNames] = useState<string[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string[]>>({});
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.level === 2 ? `└ ${c.name}` : c.name,
  }));

  useEffect(() => {
    http.get<Category[]>('/admin/categories').then((r) => setCategories(r.data));
    if (id) {
      http
        .get<{
          title: string;
          categoryId: number;
          description?: string;
          mainImage: string;
          status: SpuStatus;
          skus: Array<{ id: number; specsJson: Record<string, string>; price: number; stock: number }>;
        }>(`/admin/spus/${id}`)
        .then((r) => {
          const s = r.data;
          form.setFieldsValue({
            title: s.title,
            categoryId: s.categoryId,
            description: s.description,
            mainImage: s.mainImage,
            status: s.status,
          });
          const names = new Set<string>();
          s.skus.forEach((k) => Object.keys(k.specsJson).forEach((n) => names.add(n)));
          const sn = [...names];
          setSpecNames(sn);
          const sv: Record<string, string[]> = {};
          sn.forEach((n) => {
            sv[n] = [...new Set(s.skus.map((k) => k.specsJson[n]).filter(Boolean))];
          });
          setSpecValues(sv);
          setSkuRows(
            s.skus.map((k) => ({
              key: String(k.id),
              id: k.id,
              specs: k.specsJson,
              price: k.price,
              stock: k.stock,
            })),
          );
        });
    }
  }, [id, form]);

  const submit = async () => {
    const v = await form.validateFields();
    if (!skuRows.length) {
      message.error('请生成至少一个 SKU');
      return;
    }
    setLoading(true);
    const body = {
      categoryId: v.categoryId,
      title: v.title,
      description: v.description,
      mainImage: v.mainImage,
      images: [v.mainImage],
      status: v.status,
      skus: skuRows.map((r) => ({
        id: r.id,
        specs: r.specs,
        price: r.price,
        stock: r.stock,
      })),
    };
    try {
      if (id) await http.put(`/admin/spus/${id}`, body);
      else await http.post('/admin/spus', body);
      message.success('保存成功');
      navigate('/products');
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={id ? '编辑商品' : '发布商品'}
        description="填写基础信息并配置规格矩阵生成 SKU。"
        extra={
          <Link to="/products">
            <Button icon={<ArrowLeftOutlined />}>返回列表</Button>
          </Link>
        }
      />
      <Card title="基础信息" size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" initialValues={{ status: SpuStatus.NOT_LISTED }}>
          <Form.Item name="title" label="商品标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="商品名称" />
          </Form.Item>
          <Form.Item name="categoryId" label="所属类目" rules={[{ required: true, message: '请选择类目' }]}>
            <Select placeholder="选择类目" options={categoryOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="mainImage" label="主图 URL" rules={[{ required: true, message: '请输入主图地址' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="可选，商品详情简介" />
          </Form.Item>
          <Form.Item name="status" label="商品状态" extra="已上架且库存为 0 时将自动变为已售罄；补货后有库存可自动恢复已上架">
            <Select options={SPU_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Card>
      <Card title="规格与 SKU" size="small" style={{ marginBottom: 16 }}>
        <SpecMatrixEditor
          specNames={specNames}
          specValues={specValues}
          rows={skuRows}
          onChange={setSkuRows}
          onSpecNamesChange={setSpecNames}
          onSpecValuesChange={setSpecValues}
        />
      </Card>
      <Space>
        <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={submit}>
          保存商品
        </Button>
        <Link to="/products">
          <Button>取消</Button>
        </Link>
      </Space>
    </>
  );
}
