import { Controller, Get, Query, HttpStatus, HttpCode, Sse } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Observable, interval } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IncidentStatsService } from '../services/incident-stats.service';
import {
  IncidentStatsFilterDto,
  IncidentStatsResponseDto,
  IncidentTrendsResponseDto,
  IncidentDashboardDto,
} from '../dto/incident-stats.dto';

/**
 * Controller para estatísticas e analytics de incidentes
 */
@ApiTags('Incident Statistics')
@Controller('incidents/stats')
@ApiBearerAuth()
export class IncidentStatsController {
  constructor(private readonly statsService: IncidentStatsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter estatísticas gerais de incidentes',
    description:
      'Retorna estatísticas agregadas de incidentes com filtros opcionais por período, status, prioridade, tipo, cliente e equipe',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Data de início do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2024-12-31',
    description: 'Data de fim do período (ISO 8601)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    type: String,
    description: 'Filtrar por prioridade',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'customer_id',
    required: false,
    type: String,
    description: 'Filtrar por ID do cliente',
  })
  @ApiQuery({
    name: 'team_id',
    required: false,
    type: String,
    description: 'Filtrar por ID da equipe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas obtidas com sucesso',
    type: IncidentStatsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getGeneralStats(
    @Query() filterDto: IncidentStatsFilterDto,
  ): Promise<IncidentStatsResponseDto> {
    return this.statsService.getGeneralStats(filterDto);
  }

  @Get('trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter análise de tendências de incidentes',
    description:
      'Retorna dados de tendências agrupados por dia, semana ou mês com cálculo de variação percentual',
  })
  @ApiQuery({
    name: 'start_date',
    required: true,
    type: String,
    example: '2024-01-01',
    description: 'Data de início do período (obrigatório)',
  })
  @ApiQuery({
    name: 'end_date',
    required: true,
    type: String,
    example: '2024-12-31',
    description: 'Data de fim do período (obrigatório)',
  })
  @ApiQuery({
    name: 'group_by',
    required: false,
    type: String,
    enum: ['day', 'week', 'month'],
    example: 'day',
    description: 'Agrupamento temporal (padrão: day)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tendências calculadas com sucesso',
    type: IncidentTrendsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos ou datas ausentes',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getTrends(@Query() filterDto: IncidentStatsFilterDto): Promise<IncidentTrendsResponseDto> {
    return this.statsService.getTrends(filterDto);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter métricas para dashboard',
    description:
      'Retorna métricas em tempo real para exibição em dashboard: incidentes ativos, novos hoje, críticos, tempos médios e taxas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Métricas do dashboard obtidas com sucesso',
    type: IncidentDashboardDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getDashboardMetrics(): Promise<IncidentDashboardDto> {
    return this.statsService.getDashboardMetrics();
  }

  @Sse('stream')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Stream de métricas em tempo real (SSE)',
    description:
      'Endpoint Server-Sent Events que envia atualizações de métricas a cada 5 segundos. Alternativa ao WebSocket para dashboards.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stream de métricas iniciado',
  })
  metricsStream(): Observable<MessageEvent> {
    return interval(5000).pipe(
      switchMap(() => this.statsService.getDashboardMetrics()),
      map(
        data =>
          ({
            data,
            type: 'metrics',
          }) as MessageEvent,
      ),
    );
  }

  @Sse('stream/incremental')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Stream de métricas incrementais (SSE)',
    description:
      'Endpoint SSE que envia métricas incrementais em cache a cada 3 segundos. Mais leve que métricas completas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stream de métricas incrementais iniciado',
  })
  incrementalMetricsStream(@Query('interval') intervalMs = 3000): Observable<MessageEvent> {
    const safeInterval = Math.max(1000, Math.min(intervalMs, 30000)); // Entre 1s e 30s

    return interval(safeInterval).pipe(
      switchMap(async () => {
        // Aqui usaríamos o IncidentStatsCacheService quando integrado
        const dashboard = await this.statsService.getDashboardMetrics();
        return {
          active: dashboard.active_incidents,
          new_today: dashboard.new_today,
          resolved_today: dashboard.resolved_today,
          critical: dashboard.critical_incidents,
          timestamp: new Date(),
        };
      }),
      map(
        data =>
          ({
            data,
            type: 'incremental_metrics',
          }) as MessageEvent,
      ),
    );
  }
}
