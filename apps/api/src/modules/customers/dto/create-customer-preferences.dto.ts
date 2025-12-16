import { IsEnum, IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryPreference } from '../enums/delivery-preference.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * DTO para criação de preferências de cliente
 */
export class CreateCustomerPreferencesDto {
  @ApiPropertyOptional({
    description: 'Preferência de entrega',
    enum: DeliveryPreference,
    example: DeliveryPreference.STANDARD,
  })
  @IsEnum(DeliveryPreference)
  @IsOptional()
  deliveryPreference?: DeliveryPreference;

  @ApiPropertyOptional({
    description: 'Canal de notificação preferido',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  preferredNotificationChannel?: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Janelas de tempo preferidas para entrega',
    example: ['08:00-12:00', '14:00-18:00'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliveryTimeWindows?: string[];

  @ApiPropertyOptional({
    description: 'Itens que não podem ser entregues',
    example: ['produtos químicos', 'inflamáveis'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restrictedItems?: string[];

  @ApiPropertyOptional({
    description: 'Permite entregas em finais de semana',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowWeekendDelivery?: boolean;

  @ApiPropertyOptional({
    description: 'Requer assinatura na entrega',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requireSignature?: boolean;

  @ApiPropertyOptional({
    description: 'Instruções especiais para entregas',
    example: ['Ligar antes de entregar', 'Deixar na portaria'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialInstructions?: string[];

  @ApiPropertyOptional({
    description: 'Metadados adicionais das preferências',
    example: { horarioPreferido: 'manhã' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
