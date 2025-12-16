import { IsEnum, IsString, IsOptional, IsIP, IsDateString, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ConsentType } from "../enums/lgpdEnums";

/**
 * DTO para criação de consentimento (LGPD)
 */
export class CreateConsentDto {
  @ApiProperty({
    description: "Tipo de consentimento",
    enum: ConsentType,
    example: ConsentType.DATA_PROCESSING,
  })
  @IsEnum(ConsentType)
  declare consentType: ConsentType;

  @ApiProperty({
    description: "Versão dos termos aceitos",
    example: "1.0.0",
  })
  @IsString()
  declare termsVersion: string;

  @ApiProperty({
    description: "Descrição do propósito do consentimento",
    example: "Processamento de dados pessoais para entrega de produtos",
  })
  @IsString()
  declare purposeDescription: string;

  @ApiPropertyOptional({
    description: "Endereço IP do usuário no momento do consentimento",
    example: "192.168.1.1",
  })
  @IsOptional()
  @IsIP()
  declare consentIp?: string;

  @ApiPropertyOptional({
    description: "User agent do navegador do usuário",
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  })
  @IsOptional()
  @IsString()
  declare userAgent?: string;

  @ApiPropertyOptional({
    description: "Método de coleta do consentimento",
    example: "web_form",
  })
  @IsOptional()
  @IsString()
  declare collectionMethod?: string;

  @ApiPropertyOptional({
    description: "Data de expiração do consentimento",
    example: "2025-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  declare expiresAt?: string;

  @ApiPropertyOptional({
    description: "Metadados adicionais do consentimento",
    example: { source: "mobile_app", campaign_id: "summer_2024" },
  })
  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}
