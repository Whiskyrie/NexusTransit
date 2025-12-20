import { IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { WebhookEvent } from '../entities/webhook.entity';

/**
 * DTO para filtros de listagem de webhooks
 */
export class WebhookFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status ativo/inativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por evento específico',
    enum: WebhookEvent,
  })
  @IsOptional()
  @IsEnum(WebhookEvent)
  event?: WebhookEvent;

  @ApiPropertyOptional({
    description: 'Filtrar webhooks criados após esta data',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filtrar webhooks criados antes desta data',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;
}
