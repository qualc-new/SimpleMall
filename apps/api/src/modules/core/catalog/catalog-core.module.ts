import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AdminCatalogService } from './admin-catalog.service';

@Module({
  providers: [CatalogService, AdminCatalogService],
  exports: [CatalogService, AdminCatalogService],
})
export class CatalogCoreModule {}
