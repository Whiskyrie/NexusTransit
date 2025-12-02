import { IsEnum, IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryPreference } from '../enums/delivery-preference.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export class CreateCustomerPreferencesDto {
  @ApiPropertyOptional({
    description: 'Preferência de entrega',
    enum: DeliveryPreference,
    example: DeliveryPreference.STANDARD,
    enumName: 'DeliveryPreference',
  })
  @IsEnum(DeliveryPreference)
  @IsOptional()
  deliveryPreference?: DeliveryPreference;

  @ApiPropertyOptional({
    description: 'Canal de notificação preferido',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    enumName: 'NotificationChannel',
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  preferredNotificationChannel?: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Janelas de tempo preferidas para entrega',
    type: [String],
    example: ['08:00-12:00', '14:00-18:00'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliveryTimeWindows?: string[];

  @ApiPropertyOptional({
    description: 'Itens restritos que não devem ser entregues',
    type: [String],
    example: ['alimentos perecíveis', 'produtos frágeis'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restrictedItems?: string[];

  @ApiPropertyOptional({
    description: 'Permite entrega nos finais de semana',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowWeekendDelivery?: boolean;

  @ApiPropertyOptional({
    description: 'Exige assinatura na entrega',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requireSignature?: boolean;

  @ApiPropertyOptional({
    description: 'Instruções especiais para entrega',
    type: [String],
    example: ['Deixar com portaria', 'Ligar antes de entregar'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialInstructions?: string[];

  @ApiPropertyOptional({
    description: 'Metadados adicionais das preferências',
    example: { horario_preferencial: 'manhã' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
