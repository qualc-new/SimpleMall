import { Button, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SpuStatus } from '@simplemall/shared';
import SpecMatrixEditor, { SkuRow } from '../../components/SpecMatrixEditor';
import { http } from '../../services/http';

interface Category {
  id: number;
  name: string;
}

export default function SpuFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [specNames, setSpecNames] = useState<string[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string[]>>({});
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    http.get<Category[]>('/admin/categories').then((r) => setCategories(r.data));
    if (id) {
      http.get<{ title: string; categoryId: number; description?: string; mainImage: string; imagesJson: string[] | unknown; status: SpuStatus; skus: Array<{ id: number; specsJson: Record<string, string>; price: number; stock: number }> }>(
        `/admin/spus/${id}`,
      ).then((r) => {
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
      message.error('请生成 SKU');
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
    <div>
      <h2>{id ? '编辑商品' : '发布商品'}</h2>
      <Form form={form} layout="vertical" initialValues={{ status: SpuStatus.DRAFT }}>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="categoryId" label="类目" rules={[{ required: true }]}>
          <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="mainImage" label="主图 URL" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            options={[
              { value: SpuStatus.DRAFT, label: '草稿' },
              { value: SpuStatus.ON_SALE, label: '上架' },
              { value: SpuStatus.OFF_SALE, label: '下架' },
            ]}
          />
        </Form.Item>
      </Form>
      <SpecMatrixEditor
        specNames={specNames}
        specValues={specValues}
        rows={skuRows}
        onChange={setSkuRows}
        onSpecNamesChange={setSpecNames}
        onSpecValuesChange={setSpecValues}
      />
      <Button type="primary" className="mt-4" loading={loading} onClick={submit}>
        保存
      </Button>
    </div>
  );
}
