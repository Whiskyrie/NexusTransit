import { IsEnum, IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';
import { DeliveryPreference } from '../enums/delivery-preference.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export class CreateCustomerPreferencesDto {
  @IsEnum(DeliveryPreference)
  @IsOptional()
  deliveryPreference?: DeliveryPreference;

  @IsEnum(NotificationChannel)
  @IsOptional()
  preferredNotificationChannel?: NotificationChannel;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliveryTimeWindows?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restrictedItems?: string[];

  @IsBoolean()
  @IsOptional()
  allowWeekendDelivery?: boolean;

  @IsBoolean()
  @IsOptional()
  requireSignature?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialInstructions?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}
