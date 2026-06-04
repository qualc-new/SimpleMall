import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CartService } from '../../core/cart/cart.service';

@Controller('cart')
@UseGuards(UserTypeGuard)
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  list(@CurrentUser() user: { userId: number; type: string }) {
    return this.cart.getCart(user.userId);
  }

  @Post('items')
  add(
    @CurrentUser() user: { userId: number },
    @Body() body: { skuId: number; quantity: number },
  ) {
    return this.cart.addItem(user.userId, body.skuId, body.quantity ?? 1);
  }

  @Put('items/:id')
  update(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity?: number; selected?: boolean },
  ) {
    return this.cart.updateItem(user.userId, id, body);
  }

  @Delete('items/:id')
  remove(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.cart.removeItem(user.userId, id);
  }
}
