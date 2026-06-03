import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { http, setToken } from '../../services/http';
import { setAdmin } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await http.post<{ accessToken: string; admin: { id: number; username: string; role: string } }>(
        '/admin/auth/login',
        values,
      );
      const data = res.data as { accessToken: string; admin: { id: number; username: string; role: string } };
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
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 120 }}>
      <Card title="管理后台登录" style={{ width: 360 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
        <p style={{ marginTop: 12, color: '#888', fontSize: 12 }}>演示：admin / admin123</p>
      </Card>
    </div>
  );
}
