import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Customer } from '../entities/customer.entity';
import type { CustomerAddress } from '../entities/customer-address.entity';
import type { CustomerContact } from '../entities/customer-contact.entity';
import type { CustomerPreferences } from '../entities/customer-preferences.entity';

/**
 * DTO de resposta para cliente
 */
export class CustomerResponseDto {
  @ApiProperty({
    description: 'ID único do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '43380928828',
  })
  taxId!: string;

  @ApiProperty({
    description: 'Nome completo ou razão social',
    example: 'João Silva',
  })
  name!: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '11999999999',
  })
  phone!: string;

  @ApiProperty({
    description: 'Tipo de cliente',
    example: 'INDIVIDUAL',
  })
  type!: string;

  @ApiProperty({
    description: 'Status do cliente',
    example: 'ACTIVE',
  })
  status!: string;

  @ApiProperty({
    description: 'Categoria do cliente',
    example: 'STANDARD',
  })
  category!: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    example: { origem: 'website' },
  })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Lista de endereços do cliente',
    type: 'array',
  })
  addresses?: CustomerAddress[];

  @ApiPropertyOptional({
    description: 'Lista de contatos do cliente',
    type: 'array',
  })
  contacts?: CustomerContact[];

  @ApiPropertyOptional({
    description: 'Preferências do cliente',
    type: 'array',
  })
  preferences?: CustomerPreferences[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt!: Date;

  static fromEntity(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      taxId: customer.taxId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      type: customer.type,
      status: customer.status,
      category: customer.category,
      ...(customer.metadata && { metadata: customer.metadata }),
      addresses: customer.addresses,
      contacts: customer.contacts,
      preferences: customer.preferences,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    };
  }
}
