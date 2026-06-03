import { Button, Card, Form, Input, Switch, message } from 'antd';
import { http } from '../../services/http';
import { getAdmin } from '../../stores/authStore';

export default function MockPayPage() {
  const admin = getAdmin();

  const onFinish = async (v: { paymentNo: string; success: boolean }) => {
    try {
      await http.post('/admin/payments/mock-notify', {
        paymentNo: v.paymentNo,
        success: v.success,
      });
      message.success('回调已触发');
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  if (admin?.role !== 'SUPER') {
    return <Card>需要 SUPER 权限</Card>;
  }

  return (
    <Card title="模拟支付回调">
      <Form layout="vertical" onFinish={onFinish} initialValues={{ success: true }}>
        <Form.Item name="paymentNo" label="支付单号 paymentNo" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="success" label="是否成功" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          触发回调
        </Button>
      </Form>
    </Card>
  );
}
