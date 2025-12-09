import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MaxLength(100)
  first_name!: string;

  @IsString()
  @MaxLength(100)
  last_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  preferences?: Record<string, unknown>;
}
