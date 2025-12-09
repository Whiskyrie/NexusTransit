import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import type { AuditAction, AuditCategory } from '../enums';

/**
 * DTO de resposta para logs de auditoria
 *
 * Utilizado para retornar dados de auditoria em endpoints da API
 */
@Expose()
export class AuditLogResponseDto {
  @ApiProperty({
    description: 'ID único do log de auditoria',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Ação executada',
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'FAILED_LOGIN',
      'ACCESS_DENIED',
    ],
    example: 'CREATE',
  })
  action!: AuditAction;

  @ApiProperty({
    description: 'Categoria da operação auditada',
    enum: [
      'AUTH',
      'USER_MANAGEMENT',
      'VEHICLE_MANAGEMENT',
      'ROUTE_MANAGEMENT',
      'DELIVERY_MANAGEMENT',
      'CUSTOMER_MANAGEMENT',
      'DRIVER_MANAGEMENT',
      'INCIDENT_MANAGEMENT',
      'SYSTEM',
    ],
    example: 'DELIVERY_MANAGEMENT',
  })
  category!: AuditCategory;

  @ApiPropertyOptional({
    description: 'ID do usuário que executou a ação',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
  })
  userId!: string | null;

  @ApiPropertyOptional({
    description: 'Email do usuário que executou a ação',
    example: 'usuario@example.com',
    nullable: true,
  })
  userEmail!: string | null;

  @ApiPropertyOptional({
    description: 'Role/função do usuário',
    example: 'ADMIN',
    nullable: true,
  })
  userRole!: string | null;

  @ApiProperty({
    description: 'Tipo do recurso afetado',
    example: 'Delivery',
  })
  resourceType!: string;

  @ApiPropertyOptional({
    description: 'ID do recurso afetado',
    example: '789e0123-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  resourceId!: string | null;

  @ApiPropertyOptional({
    description: 'Endereço IP de origem da requisição',
    example: '192.168.1.1',
    nullable: true,
  })
  ipAddress!: string | null;

  @ApiPropertyOptional({
    description: 'User Agent do cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    nullable: true,
  })
  userAgent!: string | null;

  @ApiPropertyOptional({
    description: 'Método HTTP da requisição',
    example: 'POST',
    nullable: true,
  })
  requestMethod!: string | null;

  @ApiPropertyOptional({
    description: 'URL da requisição',
    example: '/api/deliveries',
    nullable: true,
  })
  requestUrl!: string | null;

  @ApiPropertyOptional({
    description: 'Código de status HTTP da resposta',
    example: 201,
    nullable: true,
  })
  statusCode!: number | null;

  @ApiPropertyOptional({
    description: 'Tempo de execução em milissegundos',
    example: 150,
    nullable: true,
  })
  executionTimeMs!: number | null;

  @ApiPropertyOptional({
    description: 'Descrição textual da operação',
    example: 'Criou uma nova entrega com ID 789',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    description: 'Metadados adicionais em formato JSON',
    example: { changedFields: ['status', 'driver_id'] },
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Valores antigos antes da modificação (apenas para UPDATE)',
    example: { status: 'pending', driver_id: null },
    nullable: true,
  })
  oldValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Valores novos após a modificação',
    example: { status: 'in_progress', driver_id: '123' },
    nullable: true,
  })
  newValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'ID da sessão',
    example: 'sess_123456789',
    nullable: true,
  })
  sessionId!: string | null;

  @ApiPropertyOptional({
    description: 'ID de correlação para rastreamento distribuído',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
    nullable: true,
  })
  correlationId!: string | null;

  @ApiProperty({
    description: 'Data e hora de criação do log',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt!: Date;

  // Campos LGPD (ocultados por padrão em respostas públicas)
  @Exclude()
  dataSubjectId?: string | null;

  @Exclude()
  legalBasis?: string | null;

  @ApiPropertyOptional({
    description: 'Indica se o log contém dados sensíveis',
    example: false,
    default: false,
  })
  sensitiveData!: boolean;

  @ApiPropertyOptional({
    description: 'Período de retenção em dias',
    example: 30,
    nullable: true,
  })
  retentionPeriodDays!: number | null;
}
