import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { ReportType, ReportStatus, ReportFormat, ReportPeriod } from "../enums";

/**
 * DTO de resposta para relatório
 */
export class ReportResponseDto {
  @ApiProperty({
    description: "ID único do relatório",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string;

  @ApiProperty({
    description: "Nome/título do relatório",
    example: "Relatório de Entregas - Dezembro 2025",
  })
  name!: string;

  @ApiProperty({
    description: "Tipo do relatório",
    enum: ReportType,
    example: ReportType.DELIVERIES,
  })
  type!: ReportType;

  @ApiProperty({
    description: "Status do relatório",
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  status!: ReportStatus;

  @ApiProperty({
    description: "Formato de exportação",
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  format!: ReportFormat;

  @ApiPropertyOptional({
    description: "Período pré-definido do relatório",
    enum: ReportPeriod,
    example: ReportPeriod.LAST_30_DAYS,
  })
  period?: ReportPeriod;

  @ApiPropertyOptional({
    description: "Data inicial do período customizado",
    example: "2025-12-01T00:00:00Z",
  })
  start_date?: Date;

  @ApiPropertyOptional({
    description: "Data final do período customizado",
    example: "2025-12-31T23:59:59Z",
  })
  end_date?: Date;

  @ApiProperty({
    description: "ID do usuário que solicitou o relatório",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  requested_by!: string;

  @ApiPropertyOptional({
    description: "Nome do usuário que solicitou",
    example: "João Silva",
  })
  requested_by_name?: string;

  @ApiPropertyOptional({
    description: "Descrição ou observações do relatório",
    example: "Relatório mensal para análise de performance",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Filtros aplicados no relatório",
    example: { status: "DELIVERED" },
  })
  filters?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Configurações adicionais do relatório",
    example: { include_charts: true },
  })
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "URL do arquivo gerado",
    example: "https://storage.example.com/reports/report-123.pdf",
  })
  file_url?: string;

  @ApiPropertyOptional({
    description: "Nome do arquivo gerado",
    example: "relatorio-entregas-dezembro-2025.pdf",
  })
  file_name?: string;

  @ApiPropertyOptional({
    description: "Tamanho do arquivo em bytes",
    example: 1048576,
  })
  file_size?: number;

  @ApiPropertyOptional({
    description: "Data de início do processamento",
    example: "2025-12-09T10:00:00Z",
  })
  processing_started_at?: Date;

  @ApiPropertyOptional({
    description: "Data de conclusão do processamento",
    example: "2025-12-09T10:05:30Z",
  })
  processing_completed_at?: Date;

  @ApiPropertyOptional({
    description: "Tempo de processamento em milissegundos",
    example: 330000,
  })
  processing_duration_ms?: number;

  @ApiPropertyOptional({
    description: "Mensagem de erro (se houver)",
    example: "Timeout ao processar dados",
  })
  error_message?: string;

  @ApiPropertyOptional({
    description: "Detalhes do erro",
    example: { code: "TIMEOUT", stack: "..." },
  })
  error_details?: Record<string, unknown>;

  @ApiProperty({
    description: "Número de registros incluídos no relatório",
    example: 1250,
  })
  records_count!: number;

  @ApiProperty({
    description: "Se o relatório está agendado",
    example: false,
  })
  is_scheduled!: boolean;

  @ApiPropertyOptional({
    description: "Expressão cron para agendamento",
    example: "0 0 * * 1",
  })
  schedule_cron?: string;

  @ApiPropertyOptional({
    description: "Próxima execução agendada",
    example: "2025-12-16T00:00:00Z",
  })
  next_execution?: Date;

  @ApiPropertyOptional({
    description: "Data de expiração do arquivo",
    example: "2026-01-31T23:59:59Z",
  })
  expires_at?: Date;

  @ApiProperty({
    description: "Se o relatório está ativo",
    example: true,
  })
  is_active!: boolean;

  @ApiProperty({
    description: "Número de downloads do relatório",
    example: 5,
  })
  download_count!: number;

  @ApiPropertyOptional({
    description: "Data do último download",
    example: "2025-12-09T14:30:00Z",
  })
  last_downloaded_at?: Date;

  @ApiProperty({
    description: "Data de criação",
    example: "2025-12-09T10:00:00Z",
  })
  created_at!: Date;

  @ApiProperty({
    description: "Data de atualização",
    example: "2025-12-09T14:30:00Z",
  })
  updated_at!: Date;

  @Exclude()
  deleted_at?: Date;
}
