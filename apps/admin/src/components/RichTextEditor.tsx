import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

interface Props {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

/** 商品详情富文本（HTML 存入 description） */
export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  return (
    <div className="rich-text-editor">
      <ReactQuill theme="snow" value={value ?? ''} onChange={onChange} modules={MODULES} placeholder={placeholder} />
    </div>
  );
}
