import { IsNotEmpty, IsString, IsEnum, IsOptional, IsEmail, ValidateIf } from 'class-validator';
import { ContactType } from '../enums/contact-type.enum';

export class CreateCustomerContactDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsEnum(ContactType)
  @IsNotEmpty()
  type!: ContactType;

  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;

  // Custom validation for email contacts
  @IsEmail()
  @ValidateIf((o: CreateCustomerContactDto) => o.type === ContactType.EMAIL)
  @IsOptional()
  get emailValue(): string | undefined {
    return this.type === ContactType.EMAIL ? this.value : undefined;
  }
}
