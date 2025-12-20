import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { WebhookLogStatus } from '../entities/webhook-log.entity';

/**
 * DTO para filtros de logs de webhook
 */
export class WebhookLogFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID do webhook',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  webhook_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: WebhookLogStatus,
  })
  @IsOptional()
  @IsEnum(WebhookLogStatus)
  status?: WebhookLogStatus;

  @ApiPropertyOptional({
    description: 'Filtrar logs após esta data',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  triggered_after?: string;

  @ApiPropertyOptional({
    description: 'Filtrar logs antes desta data',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  triggered_before?: string;
}
