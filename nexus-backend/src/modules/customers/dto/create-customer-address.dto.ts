import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressType } from '../enums/address-type.enum';
import { IsCep } from '../validators/is-cep.validator';

export class CreateCustomerAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @IsCep()
  @IsNotEmpty()
  zipCode!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.latitude !== undefined)
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.longitude !== undefined)
  @Type(() => Number)
  longitude?: number;

  @IsEnum(AddressType)
  @IsNotEmpty()
  type!: AddressType;

  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
