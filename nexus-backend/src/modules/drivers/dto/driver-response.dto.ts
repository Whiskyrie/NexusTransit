import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
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
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'CPF do motorista (formatado)',
    example: '123.456.789-01',
  })
  @Expose()
  @Transform(({ value }: { value: string | undefined }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }
    // Formata CPF: 123.456.789-01
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  })
  cpf!: string;

  @ApiProperty({
    description: 'Nome completo',
    example: 'João da Silva',
  })
  @Expose()
  full_name!: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '1990-01-15',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) => {
    if (!value) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  })
  birth_date!: string;

  @ApiProperty({
    description: 'Email',
    example: 'joao.silva@email.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Telefone (formatado)',
    example: '(11) 99999-9999',
  })
  @Expose()
  @Transform(({ value }: { value: string | undefined }) => {
    if (!value) {
      return value;
    }
    // Formata telefone celular: (11) 99999-9999
    if (value.length === 11) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    // Formata telefone fixo: (11) 9999-9999
    if (value.length === 10) {
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  })
  phone!: string;

  @ApiProperty({
    description: 'Status do motorista',
    enum: DriverStatus,
    example: DriverStatus.AVAILABLE,
  })
  @Expose()
  status!: DriverStatus;

  @ApiProperty({
    description: 'Indica se está ativo',
    example: true,
  })
  @Expose()
  is_active!: boolean;

  @ApiProperty({
    description: 'Número da CNH (formatado)',
    example: '12345678901',
  })
  @Expose()
  cnh_number!: string;

  @ApiProperty({
    description: 'Categoria da CNH',
    enum: CNHCategory,
    example: CNHCategory.B,
  })
  @Expose()
  @Transform(({ value }: { value: string | undefined }) => (value ? value.toUpperCase() : value))
  cnh_category!: CNHCategory;

  @ApiProperty({
    description: 'Data de validade da CNH',
    example: '2030-12-31',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) => {
    if (!value) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  })
  cnh_expiration_date!: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  created_at!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updated_at!: string;
}
