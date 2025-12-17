import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteMaintenanceDto {
  @ApiProperty({
    description: 'Avaliação da qualidade do serviço (0-5 estrelas)',
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsInt()
  @Min(0)
  @Max(5)
  service_rating!: number;

  @ApiPropertyOptional({
    description: 'Comentários sobre a avaliação do serviço',
    example: 'Serviço excelente, entregue no prazo',
  })
  @IsOptional()
  @IsString()
  rating_comments?: string;
}
