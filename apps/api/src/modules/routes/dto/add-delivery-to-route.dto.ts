import { IsUUID, IsOptional, IsInt, Min, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para adicionar entrega a uma rota
 */
export class AddDeliveryToRouteDto {
  @ApiProperty({
    description: 'ID da entrega a ser adicionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', {
    message: 'ID da entrega deve ser um UUID válido',
  })
  delivery_id!: string;

  @ApiPropertyOptional({
    description: 'Posição na sequência (se não informado, adiciona ao final)',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({
    message: 'Posição deve ser um número inteiro',
  })
  @Min(1, {
    message: 'Posição deve ser no mínimo 1',
  })
  sequence_order?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre a parada',
    example: 'Entrega prioritária - entregar antes das 12h',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Observações não podem exceder 500 caracteres',
  })
  notes?: string;
}
