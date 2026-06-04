import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { AddressService } from '../../core/user/address.service';

@Controller('addresses')
@UseGuards(UserTypeGuard)
export class AddressController {
  constructor(private address: AddressService) {}

  @Get()
  list(@CurrentUser() user: { userId: number }) {
    return this.address.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: number }, @Body() body: Record<string, unknown>) {
    return this.address.create(user.userId, body as Parameters<AddressService['create']>[1]);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.address.update(user.userId, id, body as Parameters<AddressService['update']>[2]);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.address.remove(user.userId, id);
  }
}
