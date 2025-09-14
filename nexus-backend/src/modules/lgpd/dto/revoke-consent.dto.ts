import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ConsentType } from '../enums';

export class RevokeConsentDto {
  @IsEnum(ConsentType)
  declare consentType: ConsentType;

  @IsOptional()
  @IsString()
  declare revocationReason?: string;
}
