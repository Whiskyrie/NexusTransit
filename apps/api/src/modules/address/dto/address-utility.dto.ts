import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';
import { IsBrazilianState } from '../validators';

/**
 * DTO para autocompletar endereço a partir do CEP
 *
 * Usado internamente ou pode ser exposto como endpoint
 */
export class AutocompleteFromCepDto {
  @ApiProperty({
    description: 'CEP para buscar dados do endereço',
    example: '01310-200',
    minLength: 8,
    maxLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 10)
  cep!: string;
}

/**
 * DTO de resposta para autocompletar endereço
 */
export class AutocompleteFromCepResponseDto {
  @ApiProperty({
    description: 'CEP formatado',
    example: '01310-200',
  })
  cep!: string;

  @ApiProperty({
    description: 'Logradouro',
    example: 'Avenida Paulista',
  })
  street!: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Bela Vista',
  })
  neighborhood!: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  city!: string;

  @ApiProperty({
    description: 'Estado (sigla UF)',
    example: 'SP',
  })
  state!: string;

  @ApiPropertyOptional({
    description: 'Código IBGE',
    example: '3550308',
  })
  ibge_code?: string;

  @ApiPropertyOptional({
    description: 'DDD',
    example: '11',
  })
  ddd?: string;

  @ApiPropertyOptional({
    description: 'Código SIAFI',
    example: '7107',
  })
  siafi_code?: string;
}

/**
 * DTO para normalização de endereço
 */
export class NormalizeAddressDto {
  @ApiPropertyOptional({
    description: 'CEP',
    example: '01310200',
  })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({
    description: 'Logradouro',
    example: 'avenida paulista',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    description: 'Número',
    example: '1578',
  })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: '  apto 101  ',
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'bela vista',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'são paulo',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado',
    example: 'sp',
  })
  @IsOptional()
  @IsString()
  @IsBrazilianState()
  state?: string;
}

/**
 * DTO de resposta para normalização
 */
export class NormalizeAddressResponseDto {
  @ApiPropertyOptional({
    description: 'CEP normalizado e formatado',
    example: '01310-200',
  })
  cep?: string;

  @ApiPropertyOptional({
    description: 'Logradouro normalizado',
    example: 'Avenida Paulista',
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'Número normalizado',
    example: '1578',
  })
  number?: string;

  @ApiPropertyOptional({
    description: 'Complemento normalizado',
    example: 'Apto 101',
  })
  complement?: string;

  @ApiPropertyOptional({
    description: 'Bairro normalizado',
    example: 'Bela Vista',
  })
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Cidade normalizada',
    example: 'São Paulo',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado normalizado (sigla maiúscula)',
    example: 'SP',
  })
  state?: string;
}
