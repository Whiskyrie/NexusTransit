import { IsString, IsNotEmpty, IsOptional, IsPositive, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartUsedDto {
  @ApiProperty({
    description: 'Nome da peça',
    example: 'Filtro de óleo',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Quantidade',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Preço unitário',
    example: 50.0,
  })
  @IsNumber()
  @IsPositive()
  unit_price!: number;

  @ApiProperty({
    description: 'Preço total',
    example: 50.0,
  })
  @IsNumber()
  @IsPositive()
  total_price!: number;

  @ApiPropertyOptional({
    description: 'Número da peça',
    example: 'FO-1234',
  })
  @IsOptional()
  @IsString()
  part_number?: string;

  @ApiPropertyOptional({
    description: 'Fornecedor',
    example: 'AutoPeças LTDA',
  })
  @IsOptional()
  @IsString()
  supplier?: string;
}
