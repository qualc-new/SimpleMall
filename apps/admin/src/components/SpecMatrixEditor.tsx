import { DeleteOutlined } from '@ant-design/icons';
import { App, Button, Input, InputNumber, Popconfirm, Space, Table } from 'antd';
import { useMemo, useState } from 'react';

export interface SkuRow {
  key: string;
  specs: Record<string, string>;
  price: number;
  stock: number;
  id?: number;
}

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);
}

interface Props {
  specNames: string[];
  specValues: Record<string, string[]>;
  rows: SkuRow[];
  onChange: (rows: SkuRow[]) => void;
  onSpecNamesChange: (names: string[]) => void;
  onSpecValuesChange: (values: Record<string, string[]>) => void;
}

export default function SpecMatrixEditor({
  specNames,
  specValues,
  rows,
  onChange,
  onSpecNamesChange,
  onSpecValuesChange,
}: Props) {
  const { message } = App.useApp();
  const [newDim, setNewDim] = useState('');

  const generate = () => {
    const dims = specNames.filter((n) => (specValues[n] || []).length > 0);
    if (!dims.length) {
      message.warning('请为至少一个规格维度填写规格值');
      return;
    }
    const combos = cartesian(dims.map((n) => specValues[n]));
    const next: SkuRow[] = combos.map((combo) => {
      const specs: Record<string, string> = {};
      dims.forEach((n, i) => {
        specs[n] = combo[i];
      });
      const key = JSON.stringify(specs);
      const old = rows.find((r) => JSON.stringify(r.specs) === key);
      return old ?? { key, specs, price: 9900, stock: 0 };
    });
    onChange(next);
  };

  const removeDimension = (name: string) => {
    if (specNames.length <= 1) {
      message.warning('至少保留一个规格维度');
      return;
    }
    const nextNames = specNames.filter((n) => n !== name);
    const nextValues = { ...specValues };
    delete nextValues[name];
    onSpecNamesChange(nextNames);
    onSpecValuesChange(nextValues);
    const filtered = rows.filter((r) => !(name in r.specs));
    onChange(filtered);
  };

  const columns = useMemo(
    () => [
      ...specNames.map((n) => ({
        title: n,
        render: (_: unknown, r: SkuRow) => r.specs[n],
      })),
      {
        title: '价格(分)',
        render: (_: unknown, r: SkuRow) => (
          <InputNumber
            min={0}
            value={r.price}
            onChange={(v) => onChange(rows.map((x) => (x.key === r.key ? { ...x, price: v ?? 0 } : x)))}
          />
        ),
      },
      {
        title: '库存',
        render: (_: unknown, r: SkuRow) => (
          <InputNumber
            min={0}
            value={r.stock}
            onChange={(v) => onChange(rows.map((x) => (x.key === r.key ? { ...x, stock: v ?? 0 } : x)))}
          />
        ),
      },
    ],
    [specNames, rows, onChange],
  );

  return (
    <div>
      <Space wrap className="mb-3">
        <Input placeholder="规格名如：颜色" value={newDim} onChange={(e) => setNewDim(e.target.value)} />
        <Button
          onClick={() => {
            const dim = newDim.trim();
            if (!dim || specNames.includes(dim)) return;
            onSpecNamesChange([...specNames, dim]);
            onSpecValuesChange({ ...specValues, [dim]: [] });
            setNewDim('');
          }}
        >
          添加规格维度
        </Button>
        <Button type="primary" onClick={generate}>
          生成 SKU 矩阵
        </Button>
      </Space>
      {specNames.map((n) => (
        <div key={n} className="spec-dim-row mb-2">
          <Space align="start">
            <span className="spec-dim-row__label">{n}：</span>
            <Input
              placeholder="多个值用逗号分隔"
              style={{ width: 320 }}
              value={(specValues[n] || []).join(',')}
              onChange={(e) =>
                onSpecValuesChange({
                  ...specValues,
                  [n]: e.target.value
                    .split(/[,，]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <Popconfirm
              title={`删除规格维度「${n}」？`}
              description="将同时移除该维度下的 SKU 组合"
              onConfirm={() => removeDimension(n)}
              disabled={specNames.length <= 1}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={specNames.length <= 1}
              >
                删除维度
              </Button>
            </Popconfirm>
          </Space>
        </div>
      ))}
      <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={rows} />
    </div>
  );
}
