import { IsString, MinLength } from 'class-validator';

export class UserRegisterDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nickname?: string;
}
