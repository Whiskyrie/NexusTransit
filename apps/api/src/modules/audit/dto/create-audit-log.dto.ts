import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditCategory } from '../enums';

/**
 * DTO para criação de log de auditoria
 */
export class CreateAuditLogDto {
  @ApiProperty({
    description: 'Ação executada',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  @IsEnum(AuditAction)
  action!: AuditAction;

  @ApiProperty({
    description: 'Categoria da operação auditada',
    enum: AuditCategory,
    example: AuditCategory.DELIVERY_MANAGEMENT,
  })
  @IsEnum(AuditCategory)
  category!: AuditCategory;

  @ApiPropertyOptional({
    description: 'ID do usuário que executou a ação',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Email do usuário que executou a ação',
    example: 'usuario@example.com',
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'Role/função do usuário',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiProperty({
    description: 'Tipo do recurso afetado',
    example: 'Delivery',
  })
  @IsString()
  resourceType!: string;

  @ApiPropertyOptional({
    description: 'ID do recurso afetado',
    example: '789e0123-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Endereço IP de origem da requisição',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User Agent do cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Método HTTP da requisição',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  requestMethod?: string;

  @ApiPropertyOptional({
    description: 'URL da requisição',
    example: '/api/deliveries',
  })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiPropertyOptional({
    description: 'Código de status HTTP da resposta',
    example: 201,
  })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Tempo de execução em milissegundos',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  executionTimeMs?: number;

  @ApiPropertyOptional({
    description: 'Descrição textual da operação',
    example: 'Criou uma nova entrega com ID 789',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais em formato JSON',
    example: { changedFields: ['status', 'driver_id'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Valores antigos antes da modificação (apenas para UPDATE)',
    example: { status: 'pending', driver_id: null },
  })
  @IsOptional()
  @IsObject()
  oldValues?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Valores novos após a modificação',
    example: { status: 'in_progress', driver_id: '123' },
  })
  @IsOptional()
  @IsObject()
  newValues?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'ID da sessão',
    example: 'sess_123456789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'ID de correlação para rastreamento distribuído',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  // LGPD compliance fields
  @ApiPropertyOptional({
    description: 'ID do titular dos dados (data subject) - LGPD',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataSubjectId?: string;

  @ApiPropertyOptional({
    description: 'Base legal para o processamento - LGPD',
    example: 'Consentimento do titular',
  })
  @IsOptional()
  @IsString()
  legalBasis?: string;

  @ApiPropertyOptional({
    description: 'Indica se o log contém dados sensíveis - LGPD',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sensitiveData?: boolean;

  @ApiPropertyOptional({
    description: 'Período de retenção customizado em dias',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  retentionPeriodDays?: number;
}
