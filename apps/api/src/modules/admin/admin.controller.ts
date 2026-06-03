import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SpuStatus } from '@simplemall/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminTypeGuard } from '../../common/guards/admin-type.guard';
import { BizError } from '../../common/exceptions/business.exception';
import { AdminService } from './admin.service';
import { PaymentService } from '../payment/payment.service';
import { AdminCatalogService } from '../catalog/admin-catalog.service';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../catalog/dto/admin-category.dto';
import { AdminCreateSpuDto, AdminUpdateSpuDto } from '../catalog/dto/admin-spu.dto';
import {
  CreateBrandDto,
  CreateExpressTemplateDto,
  CreateTagDto,
  CreateServiceGuaranteeDto,
  UpdateTagDto,
  UpdateServiceGuaranteeDto,
  UpdateBrandDto,
  UpdateExpressTemplateDto,
} from '../catalog/dto/admin-meta.dto';
import { AdminUploadService } from './admin-upload.service';

@Controller('admin')
@UseGuards(AdminTypeGuard)
export class AdminController {
  constructor(
    private admin: AdminService,
    private payment: PaymentService,
    private catalog: AdminCatalogService,
    private order: OrderService,
    private prisma: PrismaService,
    private upload: AdminUploadService,
  ) {}

  @Get('orders')
  orders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listOrders({
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get('orders/:id')
  orderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.order.adminDetail(id);
  }

  @Patch('orders/:id/ship')
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { company: string; trackingNo: string },
  ) {
    return this.admin.ship(id, body.company, body.trackingNo);
  }

  @Patch('orders/:id/refund')
  refund(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approve: boolean },
  ) {
    return this.order.processRefund(id, body.approve);
  }

  @Get('brands')
  brands() {
    return this.catalog.listBrands();
  }

  @Post('brands')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalog.createBrand(dto.name);
  }

  @Put('brands/:id')
  updateBrand(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.catalog.updateBrand(id, dto.name);
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteBrand(id);
  }

  @Get('express-templates')
  expressTemplates() {
    return this.catalog.listExpressTemplates();
  }

  @Post('express-templates')
  createExpress(@Body() dto: CreateExpressTemplateDto) {
    return this.catalog.createExpressTemplate(dto);
  }

  @Put('express-templates/:id')
  updateExpress(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpressTemplateDto) {
    return this.catalog.updateExpressTemplate(id, dto);
  }

  @Delete('express-templates/:id')
  deleteExpress(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteExpressTemplate(id);
  }

  @Get('tags')
  listTags(@Query('q') q?: string, @Query('for') forSpu?: string) {
    if (forSpu === 'spu') return this.catalog.searchTagsForSpu(q);
    return this.catalog.listTagsAdmin();
  }

  @Post('tags')
  createTag(@Body() dto: CreateTagDto) {
    return this.catalog.createTag(dto);
  }

  @Put('tags/:id')
  updateTag(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.catalog.updateTag(id, dto);
  }

  @Delete('tags/:id')
  deleteTag(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteTag(id);
  }

  @Get('service-guarantees')
  listServiceGuarantees(@Query('q') q?: string, @Query('for') forSpu?: string) {
    if (forSpu === 'spu') return this.catalog.searchServiceGuaranteesForSpu(q);
    return this.catalog.listServiceGuaranteesAdmin();
  }

  @Post('service-guarantees')
  createServiceGuarantee(@Body() dto: CreateServiceGuaranteeDto) {
    return this.catalog.createServiceGuarantee(dto);
  }

  @Put('service-guarantees/:id')
  updateServiceGuarantee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceGuaranteeDto,
  ) {
    return this.catalog.updateServiceGuarantee(id, dto);
  }

  @Delete('service-guarantees/:id')
  deleteServiceGuarantee(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deleteServiceGuarantee(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.upload.saveImage(file);
  }

  @Get('categories')
  categories() {
    return this.prisma.category.findMany({ orderBy: { sort: 'asc' } });
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: { role?: string }, @Param('id', ParseIntPipe) id: number) {
    if (user.role !== 'SUPER') throw BizError.forbidden();
    return this.catalog.deleteCategory(id);
  }

  @Get('spus')
  spus(
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
  spuDetail(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getSpuAdmin(id);
  }

  @Post('spus')
  createSpu(@Body() dto: AdminCreateSpuDto) {
    return this.catalog.createSpu(dto);
  }

  @Put('spus/:id')
  updateSpu(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateSpuDto) {
    return this.catalog.updateSpu(id, dto);
  }

  @Patch('spus/:id/status')
  patchSpuStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: SpuStatus }) {
    return this.catalog.patchSpuStatus(id, body.status);
  }

  @Patch('skus/:id/stock')
  async stock(
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

  @Post('payments/mock-notify')
  mockNotify(
    @CurrentUser() user: { role?: string },
    @Body() body: { paymentNo: string; success?: boolean },
  ) {
    if (user.role !== 'SUPER') throw BizError.forbidden();
    return this.payment.handleNotify({ paymentNo: body.paymentNo, success: body.success !== false });
  }
}
