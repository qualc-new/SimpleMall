import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminUploadService } from '../admin-upload.service';

@Controller('admin/upload')
@UseGuards(AdminTypeGuard)
export class AdminUploadController {
  constructor(private upload: AdminUploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.upload.saveImage(file);
  }
}
