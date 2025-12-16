import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '../enums/contact-type.enum';

/**
 * DTO para criação de contato de cliente
 */
export class CreateCustomerContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'Maria Silva',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Valor do contato (telefone, email, etc)',
    example: '11987654321',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({
    description: 'Tipo de contato',
    enum: ContactType,
    example: ContactType.PHONE,
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  type!: ContactType;

  @ApiPropertyOptional({
    description: 'Define se é o contato principal',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Define se o contato está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do contato',
    example: { departamento: 'Financeiro' },
  })
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
