import { Card, Typography } from 'antd';

export default function DashboardPage() {
  return (
    <Card>
      <Typography.Title level={4}>仪表盘</Typography.Title>
      <Typography.Paragraph type="secondary">
        SimpleMall 管理后台已初始化。请从左侧进入订单、商品、类目管理。
      </Typography.Paragraph>
    </Card>
  );
}
