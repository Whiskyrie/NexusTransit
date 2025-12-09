import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { IsOptional, IsDateString, IsNumber, IsString, Min, MaxLength } from 'class-validator';

/**
 * DTO para atualização de ordem de serviço
 * Herda todos os campos de CreateServiceOrderDto como opcionais
 */
export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiPropertyOptional({
    description: 'Data e hora de início da execução',
    example: '2024-12-10T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  started_at?: string;

  @ApiPropertyOptional({
    description: 'Data e hora de conclusão',
    example: '2024-12-10T12:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @ApiPropertyOptional({
    description: 'Data e hora de cancelamento',
    example: '2024-12-10T11:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  cancelled_at?: string;

  @ApiPropertyOptional({
    description: 'Custo real do serviço executado',
    example: 385.75,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_cost?: number;

  @ApiPropertyOptional({
    description: 'Tempo real de execução em minutos',
    example: 135,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Motivo do cancelamento',
    example: 'Peças não disponíveis no estoque',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellation_reason?: string;

  @ApiPropertyOptional({
    description: 'Relatório final da execução',
    example: 'Serviço concluído com sucesso. Todas as peças foram trocadas.',
  })
  @IsOptional()
  @IsString()
  completion_report?: string;

  @ApiPropertyOptional({
    description: 'Usuário que está atualizando',
    example: 'maria.santos@empresa.com',
  })
  @IsOptional()
  @IsString()
  updated_by?: string;
}
