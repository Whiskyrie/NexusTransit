import { IsEnum, IsString, IsOptional, IsIP, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataRequestType } from "../enums/lgpdEnums";

/**
 * DTO para criação de solicitação de dados (LGPD)
 */
export class CreateDataRequestDto {
  @ApiProperty({
    description: "Tipo de solicitação de dados",
    enum: DataRequestType,
    example: DataRequestType.ACCESS,
  })
  @IsEnum(DataRequestType)
  declare requestType: DataRequestType;

  @ApiPropertyOptional({
    description: "Justificativa ou razão da solicitação",
    example: "Solicitação de acesso aos dados pessoais conforme Art. 18 da LGPD",
  })
  @IsOptional()
  @IsString()
  declare reason?: string;

  @ApiPropertyOptional({
    description: "Endereço IP do solicitante",
    example: "192.168.1.1",
  })
  @IsOptional()
  @IsIP()
  declare requestIp?: string;

  @ApiPropertyOptional({
    description: "User agent do navegador",
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  })
  @IsOptional()
  @IsString()
  declare userAgent?: string;

  @ApiPropertyOptional({
    description: "Metadados adicionais da solicitação",
    example: { channel: "email", priority: "normal" },
  })
  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}
