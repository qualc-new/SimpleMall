import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
