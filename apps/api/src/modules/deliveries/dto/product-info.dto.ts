import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductInfoDto {
  @ApiPropertyOptional({
    description: 'Categoria do produto',
    example: 'Eletrônicos',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  category?: string;

  @ApiPropertyOptional({
    description: 'Nível de fragilidade',
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  fragility?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional({
    description: 'Produto perecível',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  perishable?: boolean;

  @ApiPropertyOptional({
    description: 'Empilhável',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({
    description: 'Manuseio especial (mínimo 1 instrução)',
    example: ['Fragile', 'This side up'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  special_handling?: string[];

  @ApiPropertyOptional({
    description: 'Tags do produto (mínimo 1 tag)',
    example: ['electronics', 'gift', 'urgent'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}
