import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '../entities/webhook.entity';

/**
 * DTO de resposta para webhook
 */
export class WebhookResponseDto {
  @ApiProperty({
    description: 'ID único do webhook',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Notificação Slack - Incidentes Críticos',
  })
  name!: string;

  @ApiProperty({
    description: 'URL de destino',
    example: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
  })
  url!: string;

  @ApiProperty({
    description: 'Eventos que acionam este webhook',
    enum: WebhookEvent,
    isArray: true,
  })
  events!: WebhookEvent[];

  @ApiProperty({
    description: 'Indica se o webhook está ativo',
    example: true,
  })
  is_active!: boolean;

  @ApiPropertyOptional({
    description: 'Indica se possui secret configurado',
    example: true,
  })
  has_secret?: boolean;

  @ApiPropertyOptional({
    description: 'Headers HTTP customizados',
  })
  custom_headers?: Record<string, string>;

  @ApiProperty({
    description: 'Número máximo de tentativas de retry',
    example: 3,
  })
  max_retries!: number;

  @ApiProperty({
    description: 'Timeout em milissegundos',
    example: 5000,
  })
  timeout_ms!: number;

  @ApiPropertyOptional({
    description: 'Descrição do webhook',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
  })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Data da última vez que foi disparado com sucesso',
  })
  last_triggered_at?: Date;

  @ApiProperty({
    description: 'Contador de falhas consecutivas',
    example: 0,
  })
  consecutive_failures!: number;

  @ApiProperty({
    description: 'Data de criação',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
  })
  updated_at!: Date;
}
