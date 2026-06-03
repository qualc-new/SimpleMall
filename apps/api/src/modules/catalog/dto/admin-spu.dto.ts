import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpuStatus } from '@simplemall/shared';

class SkuInputDto {
  @IsOptional()
  @IsInt()
  id?: number;

  /** 规格键值，如 { "颜色": "红" } */
  @IsObject()
  specs: Record<string, string>;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

/** 商品主表扩展字段（对齐 goods 表，金额单位为分） */
class SpuGoodsFieldsDto {
  @IsOptional()
  @IsString()
  goodsSn?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  attrJson?: Record<string, unknown> | string;

  @IsOptional()
  @IsString()
  tagList?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  marketPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vipPrice?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  volume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  warnStock?: number;

  @IsOptional()
  @IsInt()
  expressId?: number;

  @IsOptional()
  @IsInt()
  freightType?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limitBuy?: number;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecommend?: boolean;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  putawayTime?: string;
}

export class AdminCreateSpuDto extends SpuGoodsFieldsDto {
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

export class AdminUpdateSpuDto extends SpuGoodsFieldsDto {
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
