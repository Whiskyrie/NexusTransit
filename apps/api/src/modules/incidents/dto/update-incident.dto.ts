import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';
import { IncidentStatus } from '../enums/incident.enums';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {}

/**
 * DTO para atualização de status do incidente
 */
export class UpdateIncidentStatusDto {
  @ApiProperty({
    description: 'Novo status do incidente',
    enum: IncidentStatus,
    example: IncidentStatus.RESOLVED,
  })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiProperty({
    description: 'Notas sobre a resolução (opcional)',
    example: 'Problema resolvido com sucesso',
    required: false,
  })
  @IsString()
  @IsOptional()
  resolution_notes?: string;
}
