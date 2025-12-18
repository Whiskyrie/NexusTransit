import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFilterDto } from '@nexus/common';

/**
 * DTO para filtros de busca de endereços
 */
export class AddressFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por CEP',
    example: '01001-000',
  })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (UF)',
    example: 'SP',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  state?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por bairro',
    example: 'Sé',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por logradouro',
    example: 'Praça da Sé',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por endereços ativos/inativos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;
}
