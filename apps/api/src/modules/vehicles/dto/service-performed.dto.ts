import { IsString, IsNotEmpty, IsOptional, IsPositive, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServicePerformedDto {
  @ApiProperty({
    description: 'Serviço realizado',
    example: 'Troca de óleo',
  })
  @IsString()
  @IsNotEmpty()
  service!: string;

  @ApiProperty({
    description: 'Duração em horas',
    example: 1.5,
  })
  @IsNumber()
  @IsPositive()
  duration_hours!: number;

  @ApiProperty({
    description: 'Custo do serviço',
    example: 100.0,
  })
  @IsNumber()
  @IsPositive()
  cost!: number;

  @ApiPropertyOptional({
    description: 'Técnico responsável',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  technician?: string;
}
