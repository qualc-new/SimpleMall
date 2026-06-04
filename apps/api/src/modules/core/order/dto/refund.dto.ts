import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestRefundDto {
  @IsString()
  @IsNotEmpty({ message: '请填写退货原因' })
  @MaxLength(255)
  reason!: string;
}

export class AdminProcessRefundDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
