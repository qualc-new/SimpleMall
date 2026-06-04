import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { AdminUserService } from './admin-user.service';
import { UpdateAdminUserDto } from './dto/admin-user.dto';

/** 商城用户管理（API v2） */
@Controller({ path: 'admin/users', version: '2' })
@UseGuards(AdminTypeGuard)
export class AdminUserController {
  constructor(private users: AdminUserService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.users.listUsers({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      keyword,
    });
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.users.getUser(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminUserDto) {
    return this.users.updateUser(id, dto);
  }
}
