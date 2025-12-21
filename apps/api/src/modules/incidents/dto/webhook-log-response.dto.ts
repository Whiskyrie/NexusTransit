import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookLogStatus } from '../entities/webhook-log.entity';

/**
 * DTO de resposta para log de webhook
 */
export class WebhookLogResponseDto {
  @ApiProperty({
    description: 'ID único do log',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do webhook',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  webhook_id!: string;

  @ApiProperty({
    description: 'Evento que acionou',
    example: 'incident.created',
  })
  event!: string;

  @ApiProperty({
    description: 'Status da tentativa',
    enum: WebhookLogStatus,
  })
  status!: WebhookLogStatus;

  @ApiPropertyOptional({
    description: 'Código HTTP da resposta',
    example: 200,
  })
  http_status?: number;

  @ApiProperty({
    description: 'Número da tentativa',
    example: 1,
  })
  attempt_number!: number;

  @ApiProperty({
    description: 'Payload enviado',
  })
  request_payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Headers da requisição',
  })
  request_headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Corpo da resposta',
  })
  response_body?: string;

  @ApiPropertyOptional({
    description: 'Headers da resposta',
  })
  response_headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Tempo de resposta em ms',
    example: 245,
  })
  response_time_ms?: number;

  @ApiPropertyOptional({
    description: 'Mensagem de erro',
  })
  error_message?: string;

  @ApiProperty({
    description: 'Data e hora da tentativa',
  })
  triggered_at!: Date;

  @ApiProperty({
    description: 'Data de criação do log',
  })
  created_at!: Date;
}
