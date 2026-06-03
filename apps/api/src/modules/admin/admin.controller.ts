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
  UseGuards,
} from '@nestjs/common';
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

@Controller('admin')
@UseGuards(AdminTypeGuard)
export class AdminController {
  constructor(
    private admin: AdminService,
    private payment: PaymentService,
    private catalog: AdminCatalogService,
    private order: OrderService,
    private prisma: PrismaService,
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
  spus(@Query('page') page?: string) {
    return this.catalog.listSpusAdmin(page ? Number(page) : 1);
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
