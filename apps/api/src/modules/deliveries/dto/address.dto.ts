import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({
    description: 'Rua/Avenida',
    example: 'Rua das Flores',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  street!: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  number!: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: 'Apto 101',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  complement?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  neighborhood?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  city!: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state!: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 9)
  postal_code!: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: -23.5505,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -46.6333,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Instruções especiais',
    example: 'Entregar na portaria',
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  instructions?: string;
}
