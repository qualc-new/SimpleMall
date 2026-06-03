import { Typography } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  extra?: ReactNode;
};

export default function PageHeader({ title, description, extra }: Props) {
  return (
    <div className="page-header">
      <div className="page-header__main">
        <Typography.Title level={4} className="page-header__title">
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text type="secondary" className="page-header__desc">
            {description}
          </Typography.Text>
        )}
      </div>
      {extra && <div className="page-header__extra">{extra}</div>}
    </div>
  );
}
