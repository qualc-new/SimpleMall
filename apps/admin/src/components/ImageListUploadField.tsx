import { PlusOutlined } from '@ant-design/icons';
import { App, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useMemo } from 'react';
import { uploadImage } from '../services/upload';

interface Props {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxCount?: number;
}

function toFileList(urls: string[]): UploadFile[] {
  return urls.map((url, i) => ({
    uid: `${i}-${url}`,
    name: url.slice(-24),
    status: 'done',
    url,
  }));
}

/** 多图上传（轮播图） */
export default function ImageListUploadField({ value = [], onChange, maxCount = 9 }: Props) {
  const { message } = App.useApp();
  const fileList = useMemo(() => toFileList(value), [value]);

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    try {
      const url = await uploadImage(file);
      onChange?.([...value, url]);
      options.onSuccess?.(url);
    } catch (e) {
      message.error((e as Error).message);
      options.onError?.(e as Error);
    }
  };

  const onRemove = (file: UploadFile) => {
    onChange?.(value.filter((u) => u !== file.url));
  };

  return (
    <Upload
      listType="picture-card"
      fileList={fileList}
      accept="image/*"
      multiple
      customRequest={customRequest}
      onRemove={onRemove}
    >
      {value.length >= maxCount ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传轮播</div>
        </div>
      )}
    </Upload>
  );
}
