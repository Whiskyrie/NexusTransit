import { IsEnum, IsString, IsOptional, IsUUID, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DataRequestStatus } from "../enums/lgpdEnums";

/**
 * DTO para atualizar solicitação de dados (LGPD)
 */
export class UpdateDataRequestDto {
  @ApiPropertyOptional({
    description: "Novo status da solicitação",
    enum: DataRequestStatus,
    example: DataRequestStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(DataRequestStatus)
  declare status?: DataRequestStatus;

  @ApiPropertyOptional({
    description: "Notas administrativas sobre o processamento",
    example: "Solicitação aprovada pelo DPO, iniciando processamento",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare adminNotes?: string;

  @ApiPropertyOptional({
    description: "ID do usuário que processou a solicitação",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  declare processedBy?: string;

  @ApiPropertyOptional({
    description: "Mensagem de erro em caso de falha",
    example: "Não foi possível gerar o relatório: dados inconsistentes",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare errorMessage?: string;
}
