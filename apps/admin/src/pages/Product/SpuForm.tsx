import { ArrowLeftOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Collapse, Form, Input, InputNumber, Row, Select, Space, Switch } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SpuStatus } from '@simplemall/shared';
import ImageListUploadField from '../../components/ImageListUploadField';
import ImageUploadField from '../../components/ImageUploadField';
import RichTextEditor from '../../components/RichTextEditor';
import SpecMatrixEditor, { SkuRow } from '../../components/SpecMatrixEditor';
import TagInput from '../../components/TagInput';
import PageHeader from '../../components/PageHeader';
import { SPU_STATUS_OPTIONS } from '../../constants/status';
import { http } from '../../services/http';
import {
  attrToText,
  centToYuan,
  listToTags,
  tagsToList,
  textToAttr,
  yuanToCent,
} from '../../utils/spuForm';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
}

interface Brand {
  id: number;
  name: string;
}

interface ExpressTemplate {
  id: number;
  name: string;
  firstFee: number;
  continueFee: number;
  remark: string;
}

type SpuDetail = {
  title: string;
  categoryId: number;
  description?: string;
  mainImage: string;
  images?: string[];
  status: SpuStatus;
  goodsSn?: string;
  shortName?: string;
  subtitle?: string;
  brandId?: number;
  expressId?: number;
  attrJson?: Record<string, unknown>;
  tagList?: string[] | string;
  marketPrice?: number;
  costPrice?: number;
  vipPrice?: number;
  unit?: string;
  weight?: number;
  volume?: number;
  warnStock?: number;
  freightType?: number;
  limitBuy?: number;
  isNew?: boolean;
  isHot?: boolean;
  isRecommend?: boolean;
  sort?: number;
  skus: Array<{ id: number; specsJson: Record<string, string>; price: number; stock: number }>;
};

const DEFAULT_SPEC_DIM = '规格';

function initSpecFromSkus(skus: SpuDetail['skus']) {
  const names = new Set<string>();
  skus.forEach((k) => Object.keys(k.specsJson).forEach((n) => names.add(n)));
  const sn = names.size ? [...names] : [DEFAULT_SPEC_DIM];
  const sv: Record<string, string[]> = {};
  sn.forEach((n) => {
    sv[n] = [...new Set(skus.map((k) => k.specsJson[n]).filter(Boolean))];
  });
  return { specNames: sn, specValues: sv };
}

export default function SpuFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [expressList, setExpressList] = useState<ExpressTemplate[]>([]);
  const [specNames, setSpecNames] = useState<string[]>([DEFAULT_SPEC_DIM]);
  const [specValues, setSpecValues] = useState<Record<string, string[]>>({ [DEFAULT_SPEC_DIM]: [] });
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.level === 2 ? `└ ${c.name}` : c.name,
  }));

  const loadBrands = useCallback(async () => {
    const { data } = await http.get<Brand[]>('/admin/brands');
    setBrands(data);
  }, []);

  const loadExpress = useCallback(async () => {
    const { data } = await http.get<ExpressTemplate[]>('/admin/express-templates');
    setExpressList(data);
  }, []);

  useEffect(() => {
    http.get<Category[]>('/admin/categories').then((r) => setCategories(r.data));
    loadBrands();
    loadExpress();
    if (id) {
      http.get<SpuDetail>(`/admin/spus/${id}`).then((r) => {
        const s = r.data;
        const { specNames: sn, specValues: sv } = initSpecFromSkus(s.skus);
        setSpecNames(sn);
        setSpecValues(sv);
        form.setFieldsValue({
          title: s.title,
          categoryId: s.categoryId,
          description: s.description ?? '',
          mainImage: s.mainImage,
          slideImages: s.images?.length ? s.images : s.mainImage ? [s.mainImage] : [],
          status: s.status,
          goodsSn: s.goodsSn,
          shortName: s.shortName,
          subtitle: s.subtitle,
          brandId: s.brandId,
          attrText: attrToText(s.attrJson),
          tags: tagsToList(s.tagList),
          marketPriceYuan: centToYuan(s.marketPrice),
          costPriceYuan: centToYuan(s.costPrice),
          vipPriceYuan: centToYuan(s.vipPrice),
          unit: s.unit ?? '件',
          weight: s.weight,
          volume: s.volume,
          warnStock: s.warnStock,
          expressId: s.expressId && s.expressId > 0 ? s.expressId : undefined,
          freightType: s.freightType,
          limitBuy: s.limitBuy,
          isNew: s.isNew,
          isHot: s.isHot,
          isRecommend: s.isRecommend,
          sort: s.sort,
        });
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
    } else {
      setSpecNames([DEFAULT_SPEC_DIM]);
      setSpecValues({ [DEFAULT_SPEC_DIM]: [] });
      setSkuRows([]);
    }
  }, [id, form, loadBrands, loadExpress]);

  const buildPayload = (v: Record<string, unknown>) => {
    const images = (v.slideImages as string[] | undefined) ?? [];
    const mainImage = (v.mainImage as string) || images[0] || '';
    return {
      categoryId: v.categoryId,
      title: v.title,
      description: v.description,
      mainImage,
      images: images.length ? images : mainImage ? [mainImage] : [],
      status: v.status,
      goodsSn: v.goodsSn,
      shortName: v.shortName,
      subtitle: v.subtitle,
      brandId: v.brandId,
      attrJson: textToAttr(v.attrText as string),
      tagList: listToTags(v.tags as string[] | undefined),
      marketPrice: yuanToCent(v.marketPriceYuan as number),
      costPrice: yuanToCent(v.costPriceYuan as number),
      vipPrice: yuanToCent(v.vipPriceYuan as number),
      unit: v.unit,
      weight: v.weight,
      volume: v.volume,
      warnStock: v.warnStock,
      expressId: v.expressId ?? 0,
      freightType: v.freightType,
      limitBuy: v.limitBuy,
      isNew: v.isNew,
      isHot: v.isHot,
      isRecommend: v.isRecommend,
      sort: v.sort,
      skus: skuRows.map((r) => ({
        id: r.id,
        specs: r.specs,
        price: r.price,
        stock: r.stock,
      })),
    };
  };

  const submit = async () => {
    const v = await form.validateFields();
    if (!skuRows.length) {
      message.error('请生成至少一个 SKU');
      return;
    }
    setLoading(true);
    const body = buildPayload(v);
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

  const brandSelectExtra = (
    <Space size="small">
      <Link to="/brands" target="_blank">
        管理品牌
      </Link>
      <Button type="link" size="small" icon={<ReloadOutlined />} onClick={loadBrands}>
        刷新
      </Button>
    </Space>
  );

  const expressSelectExtra = (
    <Space size="small">
      <Link to="/express-templates" target="_blank">
        管理运费模板
      </Link>
      <Button type="link" size="small" icon={<ReloadOutlined />} onClick={loadExpress}>
        刷新
      </Button>
    </Space>
  );

  const collapseItems = [
    {
      key: 'basic',
      label: '基础信息',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="title" label="商品名称" rules={[{ required: true }]}>
              <Input placeholder="goods_name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="goodsSn" label="商品货号">
              <Input placeholder="留空自动生成 SM 编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="shortName" label="短标题">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="subtitle" label="副标题/卖点">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="categoryId" label="所属类目" rules={[{ required: true }]}>
              <Select options={categoryOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="brandId" label="品牌" extra={brandSelectExtra}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="选择品牌"
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="详情描述">
              <RichTextEditor placeholder="支持图文排版，保存为 HTML" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="tags" label="标签" initialValue={[]}>
              <TagInput />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sort" label="排序权重" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'media',
      label: '图片',
      children: (
        <>
          <Form.Item
            name="mainImage"
            label="主图"
            rules={[{ required: true, message: '请上传主图' }]}
            valuePropName="value"
          >
            <ImageUploadField />
          </Form.Item>
          <Form.Item name="slideImages" label="轮播图" initialValue={[]}>
            <ImageListUploadField maxCount={9} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'price',
      label: '价格与库存（SPU 层）',
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="marketPriceYuan" label="市场价(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="costPriceYuan" label="成本价(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="vipPriceYuan" label="会员价(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="warnStock" label="库存预警" initialValue={10}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="unit" label="计价单位" initialValue="件">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="limitBuy" label="限购(0不限)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'logistics',
      label: '物流与参数',
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="weight" label="重量(g)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="volume" label="体积(cm³)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="expressId" label="运费模板" extra={expressSelectExtra}>
              <Select
                allowClear
                placeholder="选择运费模板"
                showSearch
                optionFilterProp="label"
                options={expressList.map((t) => ({
                  value: t.id,
                  label: `${t.name}（首${(t.firstFee / 100).toFixed(2)}元）`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="freightType" label="包邮" initialValue={0}>
              <Select
                options={[
                  { value: 0, label: '不包邮' },
                  { value: 1, label: '包邮' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="attrText" label="商品参数 JSON" extra='attr_json，如 {"材质":"棉"}'>
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'flags',
      label: '营销与状态',
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="isNew" label="新品" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isHot" label="热销" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isRecommend" label="首页推荐" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="商品状态">
              <Select options={SPU_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={id ? '编辑商品' : '发布商品'}
        description="详情富文本、图片上传、标签词库、品牌与运费模板联动。"
        extra={
          <Link to="/products">
            <Button icon={<ArrowLeftOutlined />}>返回列表</Button>
          </Link>
        }
      />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: SpuStatus.NOT_LISTED, unit: '件', warnStock: 10, tags: [], slideImages: [] }}
        >
          <Collapse defaultActiveKey={['basic', 'media', 'price', 'flags']} items={collapseItems} />
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
