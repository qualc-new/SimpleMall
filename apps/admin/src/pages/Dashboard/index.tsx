import {
  AppstoreOutlined,
  ArrowRightOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';

type Stats = {
  categories: number;
  products: number;
  orders: number;
  onSale: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, spus, orders] = await Promise.all([
          http.get<unknown[]>('/admin/categories'),
          http.get<Array<{ status: string }>>('/admin/spus'),
          http.get<{ total: number }>('/admin/orders', { params: { pageSize: 1 } }),
        ]);
        const spuList = spus.data;
        setStats({
          categories: cats.data.length,
          products: spuList.length,
          onSale: spuList.filter((s) => s.status === 'ON_SALE').length,
          orders: orders.data.total,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickLinks = [
    { to: '/products/new', title: '发布商品', desc: '创建 SPU 与 SKU 矩阵', icon: <ShoppingOutlined /> },
    { to: '/categories', title: '管理类目', desc: '维护分类树结构', icon: <AppstoreOutlined /> },
    { to: '/orders', title: '处理订单', desc: '发货、退货审核', icon: <ShoppingCartOutlined /> },
  ];

  return (
    <>
      <PageHeader
        title="仪表盘"
        description="欢迎使用 SimpleMall 管理后台，以下为当前数据概览。"
      />
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className="dashboard-stats">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="商品总数" value={stats?.products ?? 0} suffix="件" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="在售商品" value={stats?.onSale ?? 0} suffix="件" valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="类目数量" value={stats?.categories ?? 0} suffix="个" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="订单总数" value={stats?.orders ?? 0} suffix="笔" />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Typography.Title level={5} style={{ marginTop: 28, marginBottom: 16 }}>
        快捷入口
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {quickLinks.map((item) => (
          <Col xs={24} md={8} key={item.to}>
            <Link to={item.to} className="dashboard-quick-link">
              <div style={{ fontSize: 22, marginBottom: 8, color: '#1677ff' }}>{item.icon}</div>
              <Typography.Text strong>{item.title}</Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                {item.desc}
              </Typography.Text>
              <ArrowRightOutlined style={{ marginTop: 12, color: '#bfbfbf' }} />
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
}
