import { IsNotEmpty, IsString, IsEnum, IsOptional, IsEmail, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '../enums/contact-type.enum';

export class CreateCustomerContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'Maria Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Valor do contato (email, telefone, etc)',
    example: 'maria.silva@email.com',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({
    description: 'Tipo do contato',
    enum: ContactType,
    example: ContactType.EMAIL,
    enumName: 'ContactType',
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  type!: ContactType;

  @ApiPropertyOptional({
    description: 'Indica se é o contato principal',
    example: false,
    default: false,
  })
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o contato está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
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
