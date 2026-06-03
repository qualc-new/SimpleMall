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
  @Get('home')
  home() {
    return this.catalog.getHome();
  }

  @Public()
  @Get('tags')
  tags() {
    return this.catalog.listEnabledTags();
  }

  @Public()
  @Get('tags/hot')
  hotTags() {
    return this.catalog.listHotTags();
  }

  @Public()
  @Get('spus')
  list(
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
    @Query('recommend') recommend?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.catalog.listSpus({
      categoryId: categoryId ? Number(categoryId) : undefined,
      keyword,
      tag,
      q,
      recommend: recommend === '1' || recommend === 'true',
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
