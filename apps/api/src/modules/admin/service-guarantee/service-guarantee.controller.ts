import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import {
  CreateServiceGuaranteeDto,
  UpdateServiceGuaranteeDto,
} from '../../core/catalog/dto/admin-meta.dto';

@Controller('admin/service-guarantees')
@UseGuards(AdminTypeGuard)
export class AdminServiceGuaranteeController {
  constructor(private catalog: AdminCatalogService) {}

  @Get()
  list(@Query('q') q?: string, @Query('for') forSpu?: string) {
    if (forSpu === 'spu') return this.catalog.searchServiceGuaranteesForSpu(q);
    return this.catalog.listServiceGuaranteesAdmin();
  }

  @Post()
  create(@Body() dto: CreateServiceGuaranteeDto) {
    return this.catalog.createServiceGuarantee(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceGuaranteeDto) {
    return this.catalog.updateServiceGuarantee(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteServiceGuarantee(id);
  }
}
