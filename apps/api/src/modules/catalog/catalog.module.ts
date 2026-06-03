import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { AdminCatalogService } from './admin-catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, AdminCatalogService],
  exports: [CatalogService, AdminCatalogService],
})
export class CatalogModule {}
