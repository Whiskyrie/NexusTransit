import {
  IsString,
  IsUrl,
  IsArray,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  IsObject,
  Min,
  Max,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '../entities/webhook.entity';

/**
 * DTO para criação de webhook
 */
export class CreateWebhookDto {
  @ApiProperty({
    description: 'Nome descritivo do webhook',
    example: 'Notificação Slack - Incidentes Críticos',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  name!: string;

  @ApiProperty({
    description: 'URL de destino para o webhook',
    example: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @Length(10, 500)
  url!: string;

  @ApiProperty({
    description: 'Eventos que acionam este webhook',
    enum: WebhookEvent,
    isArray: true,
    example: [WebhookEvent.INCIDENT_CREATED, WebhookEvent.INCIDENT_STATUS_CHANGED],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsNotEmpty()
  events!: WebhookEvent[];

  @ApiPropertyOptional({
    description: 'Indica se o webhook está ativo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Secret para assinatura HMAC dos payloads',
    example: 'whsec_abc123def456',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  secret?: string;

  @ApiPropertyOptional({
    description: 'Headers HTTP customizados',
    example: { 'X-Custom-Header': 'value', Authorization: 'Bearer token' },
  })
  @IsOptional()
  @IsObject()
  custom_headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Número máximo de tentativas de retry',
    minimum: 0,
    maximum: 10,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  max_retries?: number;

  @ApiPropertyOptional({
    description: 'Timeout em milissegundos para requisição HTTP',
    minimum: 1000,
    maximum: 60000,
    default: 5000,
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeout_ms?: number;

  @ApiPropertyOptional({
    description: 'Descrição do webhook',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    example: { team: 'ops', priority: 'high' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
