import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SpuStatus } from '@simplemall/shared';

class SkuInputDto {
  @IsOptional()
  @IsInt()
  id?: number;

  specs: Record<string, string>;

  @IsInt()
  price: number;

  @IsInt()
  stock: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class AdminCreateSpuDto {
  @IsInt()
  categoryId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  mainImage: string;

  @IsArray()
  images: string[];

  @IsEnum(SpuStatus)
  status: SpuStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuInputDto)
  skus: SkuInputDto[];
}

export class AdminUpdateSpuDto {
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mainImage?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsEnum(SpuStatus)
  status?: SpuStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuInputDto)
  skus?: SkuInputDto[];
}
