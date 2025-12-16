import { IsEnum, IsString, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ConsentType } from "../enums/lgpdEnums";

/**
 * DTO para revogação de consentimento (LGPD)
 */
export class RevokeConsentDto {
  @ApiProperty({
    description: "Tipo de consentimento a ser revogado",
    enum: ConsentType,
    example: ConsentType.DATA_PROCESSING,
  })
  @IsEnum(ConsentType)
  declare consentType: ConsentType;

  @ApiPropertyOptional({
    description: "Motivo da revogação do consentimento",
    example: "Não desejo mais compartilhar meus dados para fins de marketing",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare revocationReason?: string;
}
