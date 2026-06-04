import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import { CreateTagDto, UpdateTagDto } from '../../core/catalog/dto/admin-meta.dto';

@Controller('admin/tags')
@UseGuards(AdminTypeGuard)
export class AdminTagController {
  constructor(private catalog: AdminCatalogService) {}

  @Get()
  list(@Query('q') q?: string, @Query('for') forSpu?: string) {
    if (forSpu === 'spu') return this.catalog.searchTagsForSpu(q);
    return this.catalog.listTagsAdmin();
  }

  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.catalog.createTag(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.catalog.updateTag(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteTag(id);
  }
}
