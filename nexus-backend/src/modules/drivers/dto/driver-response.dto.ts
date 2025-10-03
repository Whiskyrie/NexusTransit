import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../enums/driver-status.enum';
import { CNHCategory } from '../enums/cnh-category.enum';

/**
 * DTO para resposta de motorista
 */
export class DriverResponseDto {
  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'CPF do motorista',
    example: '12345678901',
  })
  cpf!: string;

  @ApiProperty({
    description: 'Nome completo',
    example: 'João da Silva',
  })
  full_name!: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '1990-01-15',
  })
  birth_date!: string;

  @ApiProperty({
    description: 'Email',
    example: 'joao.silva@email.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Telefone',
    example: '11999999999',
  })
  phone!: string;

  @ApiProperty({
    description: 'Status do motorista',
    enum: DriverStatus,
    example: DriverStatus.AVAILABLE,
  })
  status!: DriverStatus;

  @ApiProperty({
    description: 'Indica se está ativo',
    example: true,
  })
  is_active!: boolean;

  @ApiProperty({
    description: 'Número da CNH',
    example: '12345678901',
  })
  cnh_number!: string;

  @ApiProperty({
    description: 'Categoria da CNH',
    enum: CNHCategory,
    example: CNHCategory.B,
  })
  cnh_category!: CNHCategory;

  @ApiProperty({
    description: 'Data de validade da CNH',
    example: '2030-12-31',
  })
  cnh_expiration_date!: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at!: string;
}
