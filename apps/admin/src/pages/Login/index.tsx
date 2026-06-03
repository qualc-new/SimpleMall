import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { http, setToken } from '../../services/http';
import { setAdmin } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await http.post<{
        accessToken: string;
        admin: { id: number; username: string; role: string };
      }>('/admin/auth/login', values);
      const data = res.data as {
        accessToken: string;
        admin: { id: number; username: string; role: string };
      };
      if (!data?.accessToken) {
        throw new Error('登录响应异常，请确认 API 已启动且已执行 pnpm db:seed');
      }
      setToken(data.accessToken);
      setAdmin(data.admin);
      message.success('登录成功');
      navigate('/');
    } catch (e: unknown) {
      message.error((e as Error).message || '登录失败');
    }
  };

  return (
    <div className="login-page">
      <section className="login-page__hero">
        <h1>SimpleMall 管理后台</h1>
        <p>商品、类目、订单与库存的一站式管理。轻量电商演示系统，支持 SKU 矩阵、模拟支付与发货流程。</p>
      </section>
      <section className="login-page__panel">
        <Card className="login-card" title="登录" bordered={false}>
          <Form
            form={form}
            layout="vertical"
            size="large"
            onFinish={onFinish}
            initialValues={{ username: 'admin', password: 'admin123' }}
          >
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="admin" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form>
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
            演示账号：admin / admin123
          </Typography.Text>
        </Card>
      </section>
    </div>
  );
}
