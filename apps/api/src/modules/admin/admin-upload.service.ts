import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { BizError } from '../../common/exceptions/business.exception';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class AdminUploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async saveImage(file: Express.Multer.File) {
    if (!file?.buffer?.length) throw BizError.notFound('未收到文件');
    if (file.size > MAX_BYTES) throw BizError.notFound('图片不能超过 5MB');
    const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
    if (!ALLOWED.has(ext)) throw BizError.notFound('仅支持 jpg/png/webp/gif');
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(this.uploadDir, filename), file.buffer);
    return { url: `/api/v1/uploads/${filename}`, filename };
  }
}
