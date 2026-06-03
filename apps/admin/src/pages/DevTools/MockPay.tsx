import { App, Alert, Button, Card, Form, Input, Switch } from 'antd';
import PageHeader from '../../components/PageHeader';
import { http } from '../../services/http';
import { getAdmin } from '../../stores/authStore';

export default function MockPayPage() {
  const { message } = App.useApp();
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
    return (
      <>
        <PageHeader title="模拟支付" />
        <Alert type="warning" message="需要 SUPER 管理员权限才能使用此功能" showIcon />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="模拟支付回调"
        description="开发环境用于手动触发支付成功/失败，便于联调订单状态。"
      />
      <Card style={{ maxWidth: 480 }}>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ success: true }}>
          <Form.Item name="paymentNo" label="支付单号" rules={[{ required: true, message: '请输入 paymentNo' }]}>
            <Input placeholder="从订单详情或支付记录获取" />
          </Form.Item>
          <Form.Item name="success" label="模拟结果" valuePropName="checked">
            <Switch checkedChildren="成功" unCheckedChildren="失败" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            触发回调
          </Button>
        </Form>
      </Card>
    </>
  );
}
