import { IsEnum, IsString, IsOptional, IsIP, IsDateString, IsObject } from 'class-validator';
import { ConsentType } from '../enums/lgpdEnums';

export class CreateConsentDto {
  @IsEnum(ConsentType)
  declare consentType: ConsentType;

  @IsString()
  declare termsVersion: string;

  @IsString()
  declare purposeDescription: string;

  @IsOptional()
  @IsIP()
  declare consentIp?: string;

  @IsOptional()
  @IsString()
  declare userAgent?: string;

  @IsOptional()
  @IsString()
  declare collectionMethod?: string;

  @IsOptional()
  @IsDateString()
  declare expiresAt?: string;

  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}
