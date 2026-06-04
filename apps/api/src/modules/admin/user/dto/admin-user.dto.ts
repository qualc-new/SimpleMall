import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;
}
