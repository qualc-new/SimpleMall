import { IsString, MinLength } from 'class-validator';

export class UserLoginDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class AdminLoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
