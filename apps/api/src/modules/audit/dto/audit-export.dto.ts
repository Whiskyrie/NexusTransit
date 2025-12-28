import { IsEnum, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { AuditFilterDto } from '@nexus/audit';

/**
 * Formatos de exportação suportados
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

/**
 * Status de um job de exportação
 */
export enum ExportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * DTO para solicitar exportação de logs de auditoria
 */
export class CreateAuditExportDto extends AuditFilterDto {
  @ApiProperty({
    description: 'Formato de exportação',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({
    description: 'Incluir valores antigos nas alterações',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeOldValues?: boolean = true;

  @ApiPropertyOptional({
    description: 'Incluir valores novos nas alterações',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeNewValues?: boolean = true;

  @ApiPropertyOptional({
    description: 'Incluir metadata adicional',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeMetadata?: boolean = false;

  @ApiPropertyOptional({
    description: 'Limite máximo de registros a exportar',
    example: 5000,
    minimum: 1,
    maximum: 100000,
    default: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxRecords?: number = 5000;
}

/**
 * DTO de resposta ao criar um job de exportação
 */
export class ExportJobResponseDto {
  @ApiProperty({
    description: 'ID único do job de exportação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Status atual do job',
    enum: ExportJobStatus,
    example: ExportJobStatus.PENDING,
  })
  status!: ExportJobStatus;

  @ApiProperty({
    description: 'Formato de exportação solicitado',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  format!: ExportFormat;

  @ApiProperty({
    description: 'Data/hora de criação do job',
    example: '2024-12-20T14:30:00Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Data/hora de início do processamento',
    example: '2024-12-20T14:30:05Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Data/hora de conclusão',
    example: '2024-12-20T14:30:15Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Total de registros a processar',
    example: 5000,
  })
  totalRecords?: number;

  @ApiPropertyOptional({
    description: 'Registros já processados',
    example: 2500,
  })
  processedRecords?: number;

  @ApiPropertyOptional({
    description: 'Progresso em porcentagem',
    example: 50,
  })
  progress?: number;

  @ApiPropertyOptional({
    description: 'Mensagem de erro (se falhou)',
    example: 'Erro ao processar exportação',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'URL para download do arquivo (quando completo)',
    example: '/audit/export/123e4567/download',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Tamanho do arquivo em bytes',
    example: 1048576,
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Data/hora de expiração do arquivo',
    example: '2024-12-21T14:30:00Z',
  })
  expiresAt?: Date;
}

/**
 * DTO para listagem de jobs de exportação
 */
export class ListExportJobsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: ExportJobStatus,
  })
  @IsOptional()
  @IsEnum(ExportJobStatus)
  status?: ExportJobStatus;

  @ApiPropertyOptional({
    description: 'Número de itens a retornar',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

/**
 * Estrutura interna de um job de exportação (armazenado em memória/cache)
 */
export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  format: ExportFormat;
  filters: Partial<AuditFilterDto>;
  options: {
    includeOldValues: boolean;
    includeNewValues: boolean;
    includeMetadata: boolean;
    maxRecords: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalRecords?: number;
  processedRecords?: number;
  errorMessage?: string;
  filePath?: string;
  fileSize?: number;
  expiresAt?: Date;
  userId?: string;
  userEmail?: string;
}
