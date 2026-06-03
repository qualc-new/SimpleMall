import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAdmin, getAdmin } from '../stores/authStore';
import { clearToken } from '../services/http';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/', label: <Link to="/">仪表盘</Link> },
  { key: '/categories', label: <Link to="/categories">类目管理</Link> },
  { key: '/products', label: <Link to="/products">商品列表</Link> },
  { key: '/orders', label: <Link to="/orders">订单列表</Link> },
  { key: '/dev/mock-pay', label: <Link to="/dev/mock-pay">模拟支付</Link> },
];

export default function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const admin = getAdmin();

  const logout = () => {
    clearToken();
    clearAdmin();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light">
        <div style={{ padding: 16, fontWeight: 600 }}>SimpleMall</div>
        <Menu mode="inline" selectedKeys={[loc.pathname]} items={items} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <span>{admin?.username} ({admin?.role})</span>
          <a onClick={logout}>退出</a>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
