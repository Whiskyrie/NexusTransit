import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para cancelamento de rota
 */
export class CancelRouteDto {
  @ApiProperty({
    description: 'Motivo do cancelamento',
    example: 'Veículo quebrou',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500, {
    message: 'Motivo deve ter entre 10 e 500 caracteres',
  })
  reason!: string;
}