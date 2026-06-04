import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SpuStatus } from '@simplemall/shared';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { BizError } from '../../../common/exceptions/business.exception';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminCreateSpuDto, AdminUpdateSpuDto } from '../../core/catalog/dto/admin-spu.dto';

@Controller('admin')
@UseGuards(AdminTypeGuard)
export class AdminSpuController {
  constructor(
    private catalog: AdminCatalogService,
    private prisma: PrismaService,
  ) {}

  @Get('spus')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.catalog.listSpusAdmin({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status: status || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      keyword: keyword || undefined,
    });
  }

  @Get('spus/:id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getSpuAdmin(id);
  }

  @Post('spus')
  create(@Body() dto: AdminCreateSpuDto) {
    return this.catalog.createSpu(dto);
  }

  @Put('spus/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateSpuDto) {
    return this.catalog.updateSpu(id, dto);
  }

  @Patch('spus/:id/status')
  patchStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: SpuStatus }) {
    return this.catalog.patchSpuStatus(id, body.status);
  }

  @Patch('skus/:id/stock')
  async patchSkuStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { stock?: number; delta?: number },
  ) {
    const sku = await this.prisma.sku.findUnique({ where: { id } });
    if (!sku) throw BizError.notFound();
    if (body.stock != null) {
      await this.prisma.sku.update({ where: { id }, data: { stock: body.stock } });
    } else {
      await this.prisma.sku.update({
        where: { id },
        data: { stock: { increment: body.delta ?? 0 } },
      });
    }
    await this.catalog.syncSpuStatusByStock(sku.spuId);
    return this.prisma.sku.findUnique({ where: { id }, include: { spu: true } });
  }
}
