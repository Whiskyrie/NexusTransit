import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../enums/driver-status.enum';

/**
 * DTO para filtros de busca de motoristas
 */
export class DriverFilterDto {
  @ApiProperty({
    description: 'Status do motorista',
    enum: DriverStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiProperty({
    description: 'Filtrar por nome (busca parcial)',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por CPF',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({
    description: 'Filtrar por email',
    example: 'joao@email.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Filtrar por status de atividade',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Número da página para paginação',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Limite de itens por página',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number;
}
