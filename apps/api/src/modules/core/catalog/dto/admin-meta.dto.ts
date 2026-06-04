import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TagStatus } from '@simplemall/shared';

export class CreateBrandDto {
  @IsString()
  name: string;
}

export class UpdateBrandDto {
  @IsString()
  name: string;
}

export class CreateExpressTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  firstFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  continueFee?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateExpressTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  firstFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  continueFee?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;
}

export class CreateServiceGuaranteeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsInt()
  sort?: number;
}

export class UpdateServiceGuaranteeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @IsInt()
  sort?: number;
}
