import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerDto } from './create-customer.dto';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';
import { CreateCustomerAddressDto } from './create-customer-address.dto';
import { CreateCustomerContactDto } from './create-customer-contact.dto';
import { CreateCustomerPreferencesDto } from './create-customer-preferences.dto';
import { IsBrazilianPhone } from '../validators/is-brazilian-phone.validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBrazilianPhone()
  @IsOptional()
  phone?: string;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @IsEnum(CustomerCategory)
  @IsOptional()
  category?: CustomerCategory;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerAddressDto)
  addresses?: CreateCustomerAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerContactDto)
  contacts?: CreateCustomerContactDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerPreferencesDto)
  preferences?: CreateCustomerPreferencesDto;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
