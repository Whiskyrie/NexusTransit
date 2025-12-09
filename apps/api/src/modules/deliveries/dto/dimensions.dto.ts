import { IsNumber, IsPositive, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DimensionsDto {
  @ApiProperty({
    description: 'Comprimento em cm',
    example: 30,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  length!: number;

  @ApiProperty({
    description: 'Largura em cm',
    example: 20,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  width!: number;

  @ApiProperty({
    description: 'Altura em cm',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  height!: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
    example: 'cm',
    enum: ['cm', 'in'],
  })
  @IsOptional()
  @IsEnum(['cm', 'in'])
  unit?: 'cm' | 'in';
}
