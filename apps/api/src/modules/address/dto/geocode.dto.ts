import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para geocodificação de endereço
 */
export class GeocodeDto {
  @ApiProperty({
    description: 'Endereço completo para geocodificação',
    example: 'Praça da Sé, 123, Sé, São Paulo, SP',
  })
  @IsNotEmpty()
  @IsString()
  address!: string;
}
