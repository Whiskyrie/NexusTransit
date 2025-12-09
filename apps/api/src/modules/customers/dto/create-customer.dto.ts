import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';
import { CreateCustomerAddressDto } from './create-customer-address.dto';
import { CreateCustomerContactDto } from './create-customer-contact.dto';
import { CreateCustomerPreferencesDto } from './create-customer-preferences.dto';
import { IsCpfCnpj } from '../validators/is-cpf-cnpj.validator';
import { IsBrazilianPhone } from '../validators/is-brazilian-phone.validator';

export class CreateCustomerDto {
  @IsCpfCnpj()
  @IsNotEmpty()
  taxId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsBrazilianPhone()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(CustomerType)
  @IsNotEmpty()
  type!: CustomerType;

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
