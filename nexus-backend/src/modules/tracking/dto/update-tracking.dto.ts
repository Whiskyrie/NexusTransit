import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTrackingDto } from './create-tracking.dto';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO para atualização de registro de rastreamento
 *
 * Permite atualização parcial de campos específicos
 * Campos de coordenadas e timestamp geralmente não são atualizados
 */
export class UpdateTrackingDto extends PartialType(CreateTrackingDto) {
  @ApiPropertyOptional({
    description: 'Atualizar validação do ponto',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_valid?: boolean;

  @ApiPropertyOptional({
    description: 'Marcar/desmarcar como ponto de parada',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_stop?: boolean;
}
