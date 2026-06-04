import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import {
  CreateExpressTemplateDto,
  UpdateExpressTemplateDto,
} from '../../core/catalog/dto/admin-meta.dto';

@Controller('admin/express-templates')
@UseGuards(AdminTypeGuard)
export class AdminExpressController {
  constructor(private catalog: AdminCatalogService) {}

  @Get()
  list() {
    return this.catalog.listExpressTemplates();
  }

  @Post()
  create(@Body() dto: CreateExpressTemplateDto) {
    return this.catalog.createExpressTemplate(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpressTemplateDto) {
    return this.catalog.updateExpressTemplate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteExpressTemplate(id);
  }
}
