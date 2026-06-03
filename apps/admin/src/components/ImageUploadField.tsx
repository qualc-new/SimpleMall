import { PlusOutlined } from '@ant-design/icons';
import { App, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { uploadImage } from '../services/upload';

interface Props {
  value?: string;
  onChange?: (url: string) => void;
}

/** 单图上传（主图） */
export default function ImageUploadField({ value, onChange }: Props) {
  const { message } = App.useApp();

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    try {
      const url = await uploadImage(file);
      onChange?.(url);
      options.onSuccess?.(url);
    } catch (e) {
      message.error((e as Error).message);
      options.onError?.(e as Error);
    }
  };

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      customRequest={customRequest}
    >
      {value ? (
        <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传主图</div>
        </div>
      )}
    </Upload>
  );
}
