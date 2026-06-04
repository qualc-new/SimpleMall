import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import { CreateBrandDto, UpdateBrandDto } from '../../core/catalog/dto/admin-meta.dto';

@Controller('admin/brands')
@UseGuards(AdminTypeGuard)
export class AdminBrandController {
  constructor(private catalog: AdminCatalogService) {}

  @Get()
  list() {
    return this.catalog.listBrands();
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.catalog.createBrand(dto.name);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.catalog.updateBrand(id, dto.name);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteBrand(id);
  }
}
