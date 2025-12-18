import { PartialType } from '@nestjs/swagger';
import { CreateTrackingEventDto } from './create-tracking-event.dto';

/**
 * DTO para atualização de evento de rastreamento
 *
 * Todos os campos são opcionais
 */
export class UpdateTrackingEventDto extends PartialType(CreateTrackingEventDto) {}
