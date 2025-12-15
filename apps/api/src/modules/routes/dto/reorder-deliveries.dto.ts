import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Item de reordenação
 */
export class ReorderItem {
  @ApiProperty({
    description: 'ID da parada (RouteStop)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  stop_id!: string;

  @ApiProperty({
    description: 'Nova posição na sequência',
    example: 3,
    minimum: 1,
  })
  new_sequence!: number;
}

/**
 * DTO para reordenar entregas na rota
 */
export class ReorderDeliveriesDto {
  @ApiProperty({
    description: 'Lista com IDs das paradas e suas novas posições',
    type: [ReorderItem],
    example: [
      { stop_id: '123e4567-e89b-12d3-a456-426614174000', new_sequence: 1 },
      { stop_id: '223e4567-e89b-12d3-a456-426614174001', new_sequence: 2 },
      { stop_id: '323e4567-e89b-12d3-a456-426614174002', new_sequence: 3 },
    ],
  })
  @IsArray({
    message: 'Deve ser um array de itens',
  })
  @ArrayMinSize(1, {
    message: 'Deve conter pelo menos uma parada',
  })
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  stops!: ReorderItem[];
}
