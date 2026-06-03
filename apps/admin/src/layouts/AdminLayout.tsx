import {
  AppstoreOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { buildBreadcrumbs, matchMenuKey } from '../utils/menu';
import { clearAdmin, getAdmin } from '../stores/authStore';
import { clearToken } from '../services/http';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">仪表盘</Link> },
  { key: '/categories', icon: <AppstoreOutlined />, label: <Link to="/categories">类目管理</Link> },
  { key: '/brands', icon: <AppstoreOutlined />, label: <Link to="/brands">品牌管理</Link> },
  { key: '/express-templates', icon: <AppstoreOutlined />, label: <Link to="/express-templates">运费模板</Link> },
  { key: '/products', icon: <ShoppingOutlined />, label: <Link to="/products">商品列表</Link> },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">订单列表</Link> },
  {
    key: '/dev/mock-pay',
    icon: <ExperimentOutlined />,
    label: <Link to="/dev/mock-pay">模拟支付</Link>,
  },
];

export default function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const admin = getAdmin();
  const selectedKey = matchMenuKey(loc.pathname);
  const breadcrumbs = buildBreadcrumbs(loc.pathname);

  const logout = () => {
    clearToken();
    clearAdmin();
    navigate('/login');
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark" breakpoint="lg" collapsedWidth={64}>
        <div className="admin-sider__brand">
          <span className="admin-sider__logo">SM</span>
          <span>SimpleMall</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="admin-header" style={{ height: 64, lineHeight: '64px' }}>
          <Breadcrumb
            items={breadcrumbs.map((b, i) => ({
              title:
                b.href && i < breadcrumbs.length - 1 ? (
                  <Link to={b.href}>{b.title}</Link>
                ) : (
                  b.title
                ),
            }))}
          />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div className="admin-header__user">
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <Typography.Text>
                {admin?.username}
                <Typography.Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                  {admin?.role}
                </Typography.Text>
              </Typography.Text>
            </div>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <div className="admin-content__card">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
