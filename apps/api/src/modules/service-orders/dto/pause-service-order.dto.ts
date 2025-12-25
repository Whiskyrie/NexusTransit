import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para pausar uma ordem de serviço
 */
export class PauseServiceOrderDto {
  @ApiPropertyOptional({
    description: 'Motivo da pausa',
    example: 'Aguardando aprovação do cliente',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário que pausou a ordem',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
