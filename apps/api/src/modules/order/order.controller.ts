import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { UserTypeGuard } from '../../common/guards/user-type.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(UserTypeGuard)
export class OrderController {
  constructor(private order: OrderService) {}

  @Post()
  create(@CurrentUser() user: { userId: number }, @Body() body: Record<string, unknown>) {
    return this.order.create(user.userId, body as Parameters<OrderService['create']>[1]);
  }

  @Get()
  list(
    @CurrentUser() user: { userId: number },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.order.list(
      user.userId,
      status,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get(':id')
  detail(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.order.detail(user.userId, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.order.cancel(user.userId, id);
  }

  @Post(':id/refund')
  refund(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.order.requestRefund(user.userId, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.order.confirmReceive(user.userId, id);
  }
}
