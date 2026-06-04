import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminService } from '../admin.service';
import { OrderService } from '../../core/order/order.service';
import { AdminProcessRefundDto } from '../../core/order/dto/refund.dto';

@Controller('admin/orders')
@UseGuards(AdminTypeGuard)
export class AdminOrderController {
  constructor(
    private admin: AdminService,
    private order: OrderService,
  ) {}

  @Get()
  list(
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

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.order.adminDetail(id);
  }

  @Patch(':id/ship')
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { company: string; trackingNo: string },
  ) {
    return this.admin.ship(id, body.company, body.trackingNo);
  }

  @Patch(':id/refund')
  refund(@Param('id', ParseIntPipe) id: number, @Body() body: AdminProcessRefundDto) {
    return this.order.processRefund(id, body.approve, body.reason);
  }
}
