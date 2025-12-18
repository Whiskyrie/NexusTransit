import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de resposta para endereço
 */
export class AddressResponseDto {
  @ApiProperty({
    description: 'ID único do endereço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'CEP do endereço',
    example: '01001-000',
  })
  cep?: string;

  @ApiProperty({
    description: 'Logradouro/rua do endereço',
    example: 'Praça da Sé',
  })
  street!: string;

  @ApiPropertyOptional({
    description: 'Número do endereço',
    example: '123',
  })
  number?: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    example: 'Apto 45',
  })
  complement?: string;

  @ApiProperty({
    description: 'Bairro do endereço',
    example: 'Sé',
  })
  neighborhood!: string;

  @ApiProperty({
    description: 'Cidade do endereço',
    example: 'São Paulo',
  })
  city!: string;

  @ApiProperty({
    description: 'Estado do endereço (UF)',
    example: 'SP',
  })
  state!: string;

  @ApiPropertyOptional({
    description: 'País do endereço',
    example: 'Brasil',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude do endereço',
    example: -23.55052,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do endereço',
    example: -46.633308,
  })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Endereço completo formatado',
    example: 'Praça da Sé, 123, Sé, São Paulo, SP',
  })
  formatted_address?: string;

  @ApiPropertyOptional({
    description: 'Código do IBGE da cidade',
    example: '3550308',
  })
  ibge_code?: string;

  @ApiPropertyOptional({
    description: 'Código GIA',
    example: '1004',
  })
  gia_code?: string;

  @ApiPropertyOptional({
    description: 'DDD da região',
    example: '11',
  })
  ddd?: string;

  @ApiPropertyOptional({
    description: 'Código SIAFI',
    example: '7107',
  })
  siafi_code?: string;

  @ApiProperty({
    description: 'Indica se o endereço está ativo',
    example: true,
  })
  is_active!: boolean;

  @ApiPropertyOptional({
    description: 'Observações sobre o endereço',
    example: 'Portão azul',
  })
  notes?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00Z',
  })
  updated_at!: Date;
}
