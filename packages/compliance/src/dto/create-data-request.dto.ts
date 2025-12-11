import { IsEnum, IsString, IsOptional, IsIP, IsObject } from 'class-validator';
import { DataRequestType } from '../enums/lgpdEnums';

export class CreateDataRequestDto {
  @IsEnum(DataRequestType)
  declare requestType: DataRequestType;

  @IsOptional()
  @IsString()
  declare reason?: string;

  @IsOptional()
  @IsIP()
  declare requestIp?: string;

  @IsOptional()
  @IsString()
  declare userAgent?: string;

  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}
