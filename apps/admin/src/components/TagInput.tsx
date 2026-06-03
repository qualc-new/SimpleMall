import { App, Select } from 'antd';
import { useCallback, useState } from 'react';
import { http } from '../services/http';

interface TagOption {
  name: string;
}

interface Props {
  value?: string[];
  onChange?: (tags: string[]) => void;
}

/** 标签：可删改、检索词库、回车创建新标签 */
export default function TagInput({ value = [], onChange }: Props) {
  const { message } = App.useApp();
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { data } = await http.get<TagOption[]>('/admin/tags', { params: { q: q || undefined } });
      setOptions(data.map((t) => ({ value: t.name, label: t.name })));
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureTags = async (tags: string[]) => {
    for (const name of tags) {
      const n = name.trim();
      if (!n) continue;
      try {
        await http.post('/admin/tags', { name: n });
      } catch {
        /* 已存在等可忽略 */
      }
    }
  };

  const handleChange = async (next: string[]) => {
    const cleaned = next.map((t) => t.trim()).filter(Boolean);
    const added = cleaned.filter((t) => !value.includes(t));
    if (added.length) {
      await ensureTags(added);
    }
    onChange?.(cleaned);
  };

  return (
    <Select
      mode="tags"
      style={{ width: '100%' }}
      placeholder="输入标签，回车添加；支持检索已有标签"
      value={value}
      onChange={handleChange}
      onSearch={search}
      onFocus={() => search('')}
      options={options}
      loading={loading}
      filterOption={false}
      tokenSeparators={[',', '，']}
      notFoundContent={loading ? '检索中…' : '回车创建新标签'}
      onInputKeyDown={(e) => {
        if (e.key === 'Enter') {
          const input = (e.target as HTMLInputElement).value?.trim();
          if (input && !value.includes(input)) {
            void ensureTags([input]).then(() => message.success(`已添加标签「${input}」`));
          }
        }
      }}
    />
  );
}
