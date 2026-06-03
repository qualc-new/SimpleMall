import { Button, Input, InputNumber, Space, Table } from 'antd';
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
  const [newDim, setNewDim] = useState('');

  const generate = () => {
    const dims = specNames.filter((n) => (specValues[n] || []).length > 0);
    if (!dims.length) return;
    const combos = cartesian(dims.map((n) => specValues[n]));
    const next: SkuRow[] = combos.map((combo) => {
      const specs: Record<string, string> = {};
      dims.forEach((n, i) => { specs[n] = combo[i]; });
      const key = JSON.stringify(specs);
      const old = rows.find((r) => JSON.stringify(r.specs) === key);
      return old ?? { key, specs, price: 9900, stock: 0 };
    });
    onChange(next);
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
            if (!newDim || specNames.includes(newDim)) return;
            onSpecNamesChange([...specNames, newDim]);
            onSpecValuesChange({ ...specValues, [newDim]: [] });
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
        <div key={n} className="mb-2">
          <span>{n}：</span>
          <Input
            placeholder="多个值用逗号分隔"
            style={{ width: 320 }}
            value={(specValues[n] || []).join(',')}
            onChange={(e) =>
              onSpecValuesChange({
                ...specValues,
                [n]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
      ))}
      <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={rows} />
    </div>
  );
}
