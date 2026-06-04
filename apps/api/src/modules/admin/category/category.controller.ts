import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { BizError } from '../../../common/exceptions/business.exception';
import { AdminCatalogService } from '../../core/catalog/admin-catalog.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../core/catalog/dto/admin-category.dto';

@Controller('admin/categories')
@UseGuards(AdminTypeGuard)
export class AdminCategoryController {
  constructor(
    private catalog: AdminCatalogService,
    private prisma: PrismaService,
  ) {}

  @Get()
  list() {
    return this.prisma.category.findMany({ orderBy: { sort: 'asc' } });
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { role?: string }, @Param('id', ParseIntPipe) id: number) {
    if (user.role !== 'SUPER') throw BizError.forbidden();
    return this.catalog.deleteCategory(id);
  }
}
