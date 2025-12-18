import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateTrackingEventDto } from './create-tracking-event.dto';

/**
 * DTO para criação de múltiplos eventos de rastreamento
 *
 * Usado para sincronização offline de eventos
 */
export class BatchTrackingEventsDto {
  @ApiProperty({
    description: 'Lista de eventos de rastreamento a serem criados',
    type: [CreateTrackingEventDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrackingEventDto)
  events!: CreateTrackingEventDto[];
}
