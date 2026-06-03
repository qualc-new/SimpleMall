import { ReloadOutlined } from '@ant-design/icons';
import { Button, Select, Space } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../services/http';

export interface ServiceGuaranteeOption {
  id: number;
  name: string;
  status: string;
  sort: number;
}

interface Props {
  value?: string[];
  onChange?: (names: string[]) => void;
}

/** 商品服务保障：从服务保障管理中选择（仅启用） */
export default function ServiceGuaranteeInput({ value = [], onChange }: Props) {
  const [options, setOptions] = useState<ServiceGuaranteeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const { data } = await http.get<ServiceGuaranteeOption[]>('/admin/service-guarantees', {
        params: { for: 'spu', q: q || undefined },
      });
      setOptions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectOptions = options.map((t) => ({
    value: t.name,
    label: t.name,
  }));

  return (
    <div>
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        placeholder="选择服务保障（需在服务保障管理中启用）"
        value={value}
        onChange={(v) => onChange?.(v)}
        options={selectOptions}
        loading={loading}
        showSearch
        optionFilterProp="value"
        onSearch={load}
        onFocus={() => load()}
      />
      <Space size="small" style={{ marginTop: 8 }}>
        <Link to="/service-guarantees" target="_blank">
          管理服务保障
        </Link>
        <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => load()}>
          刷新
        </Button>
      </Space>
    </div>
  );
}
