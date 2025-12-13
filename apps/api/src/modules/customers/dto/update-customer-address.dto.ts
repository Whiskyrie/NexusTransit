import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressType } from '../enums/address-type.enum';

export class UpdateCustomerAddressDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  street?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  number?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  complement?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @Length(8, 8)
  zipCode?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  city?: string;

  @IsString()
  @IsOptional()
  @Length(2, 2)
  state?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
