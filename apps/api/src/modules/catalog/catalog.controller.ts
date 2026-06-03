import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Public()
  @Get('categories/tree')
  tree() {
    return this.catalog.getCategoryTree();
  }

  @Public()
  @Get('spus')
  list(
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.catalog.listSpus({
      categoryId: categoryId ? Number(categoryId) : undefined,
      keyword,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Public()
  @Get('spus/:id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getSpuDetail(id);
  }
}
