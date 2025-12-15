import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { RouteMetricsService } from './services/route-metrics.service';
import { RouteValidationService } from './services/route-validation.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteFilterDto } from './dto/filter-route.dto';
import { RouteResponseDto, RouteStopResponseDto } from './dto/route-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { CancelRouteDto } from './dto/cancel_route.dto';
import { SuggestRoutesDto, SuggestRoutesResponseDto } from './dto/suggest-routes.dto';
import { AutoAssignDto, AutoAssignResponseDto } from './dto/auto-assign.dto';
import { AddDeliveryToRouteDto } from './dto/add-delivery-to-route.dto';
import { ReorderDeliveriesDto } from './dto/reorder-deliveries.dto';
import { RouteStatusInterceptor } from './interceptors/route-status.interceptor';
import { RouteValidationInterceptor } from './interceptors/route-validation.interceptor';
import { RouteStatistics, RouteMapData, GeoPoint } from './interfaces';
import { RouteStop } from './entities/route_stop.entity';

/**
 * Controller de rotas
 *
 * Gerencia todas as operações relacionadas a rotas de entrega:
 * - CRUD completo
 * - Operações de status (iniciar, pausar, retomar, finalizar, cancelar)
 * - Filtros e buscas avançadas
 * - Histórico e rastreamento
 */
@ApiTags('Routes')
@Controller('routes')
@ApiBearerAuth()
@UseInterceptors(RouteStatusInterceptor, RouteValidationInterceptor)
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly optimizationService: RouteOptimizationService,
    private readonly metricsService: RouteMetricsService,
    private readonly validationService: RouteValidationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova rota',
    description: 'Cria uma nova rota com validações de disponibilidade de motorista e veículo',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rota criada com sucesso',
    type: RouteResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou violação de regras de negócio',
  })
  @ApiConflictResponse({
    description: 'Motorista ou veículo já possui rota ativa',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para criar rotas',
  })
  async create(@Body() createDto: CreateRouteDto): Promise<RouteResponseDto> {
    return this.routesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar rotas',
    description:
      'Lista rotas com filtros, paginação e busca. Retorna rotas com informações de veículo e motorista.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página (máximo 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por nome da rota',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED'],
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['URBAN', 'INTERSTATE', 'RURAL', 'EXPRESS', 'LOCAL'],
    description: 'Filtrar por tipo de rota',
  })
  @ApiQuery({
    name: 'vehicle_id',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtrar por veículo',
  })
  @ApiQuery({
    name: 'driver_id',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtrar por motorista',
  })
  @ApiQuery({
    name: 'planned_date_from',
    required: false,
    type: String,
    format: 'date',
    description: 'Data planejada inicial',
  })
  @ApiQuery({
    name: 'planned_date_to',
    required: false,
    type: String,
    format: 'date',
    description: 'Data planejada final',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de rotas retornada com sucesso',
    type: PaginatedResponseDto<RouteResponseDto>,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findAll(
    @Query() filterDto: RouteFilterDto,
  ): Promise<PaginatedResponseDto<RouteResponseDto>> {
    return this.routesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar rota por ID',
    description:
      'Retorna detalhes completos da rota incluindo paradas, veículo, motorista e endereços',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota encontrada',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RouteResponseDto> {
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar rota',
    description:
      'Atualiza campos específicos da rota. Apenas rotas com status PLANNED podem ser editadas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota atualizada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou rota não pode ser editada no status atual',
  })
  @ApiConflictResponse({
    description: 'Conflito de disponibilidade de motorista ou veículo',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar rotas',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRouteDto,
  ): Promise<RouteResponseDto> {
    return this.routesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover rota',
    description: 'Remove rota (soft delete). Rotas em execução não podem ser removidas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Rota removida com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota em execução não pode ser removida',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para remover rotas',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.routesService.remove(id);
  }

  // ========== OPERAÇÕES DE STATUS ==========

  @Post(':id/start')
  @ApiOperation({
    summary: 'Iniciar rota',
    description: 'Inicia a execução de uma rota planejada. Registra horário de início real.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota iniciada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser iniciada no status atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para iniciar rotas',
  })
  async start(@Param('id', ParseUUIDPipe) id: string): Promise<RouteResponseDto> {
    return this.routesService.startRoute(id);
  }

  @Post(':id/pause')
  @ApiOperation({
    summary: 'Pausar rota',
    description: 'Pausa uma rota em execução. A rota pode ser retomada posteriormente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota pausada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser pausada no status atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para pausar rotas',
  })
  async pause(@Param('id', ParseUUIDPipe) id: string): Promise<RouteResponseDto> {
    return this.routesService.pauseRoute(id);
  }

  @Post(':id/resume')
  @ApiOperation({
    summary: 'Retomar rota',
    description: 'Retoma execução de uma rota pausada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota retomada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser retomada no status atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para retomar rotas',
  })
  async resume(@Param('id', ParseUUIDPipe) id: string): Promise<RouteResponseDto> {
    return this.routesService.resumeRoute(id);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Finalizar rota',
    description:
      'Finaliza uma rota em execução. Registra horário de término e calcula duração real.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota finalizada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser finalizada no status atual',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para finalizar rotas',
  })
  async complete(@Param('id', ParseUUIDPipe) id: string): Promise<RouteResponseDto> {
    return this.routesService.completeRoute(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar rota',
    description:
      'Cancela uma rota com motivo obrigatório. Rotas finalizadas não podem ser canceladas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da rota (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota cancelada com sucesso',
    type: RouteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser cancelada no status atual ou motivo inválido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para cancelar rotas',
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelRouteDto,
  ): Promise<RouteResponseDto> {
    return this.routesService.cancelRoute(id, cancelDto.reason);
  }

  @Post(':id/optimize')
  @ApiOperation({
    summary: 'Otimizar rota',
    description:
      'Aplica algoritmo de otimização (Nearest Neighbor) para reordenar as paradas da rota minimizando distância total',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rota otimizada com sucesso',
    schema: {
      properties: {
        route: { type: 'object', description: 'Rota atualizada' },
        optimization: {
          type: 'object',
          properties: {
            total_distance_km: { type: 'number' },
            total_duration_minutes: { type: 'number' },
            optimization_score: { type: 'number' },
            algorithm_used: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser otimizada no status atual',
  })
  async optimizeRoute(@Param('id', ParseUUIDPipe) id: string): Promise<{
    optimized_route: GeoPoint[];
    optimization: {
      total_distance_km: number;
      total_duration_minutes: number;
      optimization_score: number;
      algorithm_used: string;
    };
  }> {
    const result = await this.optimizationService.optimizeRoute(id);
    return {
      optimized_route: result.optimized_route,
      optimization: {
        total_distance_km: result.total_distance_km,
        total_duration_minutes: result.total_duration_minutes,
        optimization_score: result.optimization_score,
        algorithm_used: result.algorithm_used,
      },
    };
  }

  @Get(':id/metrics')
  @ApiOperation({
    summary: 'Obter métricas da rota',
    description:
      'Retorna métricas detalhadas da rota incluindo distância, duração, paradas, eficiência e estimativas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Métricas calculadas com sucesso',
    schema: {
      properties: {
        route_id: { type: 'string' },
        route_code: { type: 'string' },
        status: { type: 'string' },
        total_distance_km: { type: 'number' },
        total_duration_minutes: { type: 'number' },
        total_stops: { type: 'number' },
        completed_stops: { type: 'number' },
        completion_percentage: { type: 'number' },
        efficiency_score: { type: 'number' },
        on_time_stops: { type: 'number' },
        delayed_stops: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  async getRouteMetrics(@Param('id', ParseUUIDPipe) id: string): Promise<RouteStatistics> {
    return this.metricsService.calculateRouteMetrics(id);
  }

  @Get(':id/map')
  @ApiOperation({
    summary: 'Obter dados para visualização em mapa',
    description:
      'Retorna rota formatada para renderização em mapa com coordenadas, marcadores e polyline',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do mapa retornados com sucesso',
    schema: {
      properties: {
        route_code: { type: 'string' },
        status: { type: 'string' },
        start_location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        end_location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        stops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sequence: { type: 'number' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              status: { type: 'string' },
              address: { type: 'string' },
            },
          },
        },
        polyline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' },
            },
          },
        },
        total_distance_km: { type: 'number' },
        total_duration_minutes: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  async getRouteMapData(@Param('id', ParseUUIDPipe) id: string): Promise<RouteMapData> {
    return this.routesService.getRouteMapData(id);
  }

  @Get('suggest')
  @ApiOperation({
    summary: 'Sugerir rotas otimizadas',
    description:
      'Analisa entregas pendentes e sugere rotas otimizadas agrupando entregas geograficamente próximas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rotas sugeridas geradas com sucesso',
    type: SuggestRoutesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Nenhuma entrega disponível para sugestão',
  })
  async suggestRoutes(@Query() suggestDto: SuggestRoutesDto): Promise<SuggestRoutesResponseDto> {
    const suggestions = await this.optimizationService.suggestOptimizedRoutes(
      suggestDto.target_date,
      suggestDto.max_routes,
      suggestDto.max_stops_per_route,
    );

    const totalDeliveriesCovered = suggestions.reduce(
      (sum, route) => sum + route.estimated_deliveries,
      0,
    );

    return {
      suggested_routes: suggestions,
      total_suggestions: suggestions.length,
      total_deliveries_covered: totalDeliveriesCovered,
      pending_deliveries: 0, // TODO: calcular entregas restantes
    };
  }

  @Post('auto-assign')
  @ApiOperation({
    summary: 'Atribuir automaticamente motorista e veículo',
    description:
      'Encontra automaticamente motorista e veículo disponíveis e os atribui à rota especificada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Motorista e veículo atribuídos com sucesso',
    type: AutoAssignResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Nenhum motorista ou veículo disponível',
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  async autoAssign(@Body() autoAssignDto: AutoAssignDto): Promise<AutoAssignResponseDto> {
    // Buscar rota para obter data
    const route = await this.routesService.findOne(autoAssignDto.route_id);

    const routeDate = autoAssignDto.route_date
      ? new Date(autoAssignDto.route_date)
      : new Date(route.planned_date);

    // Encontrar motorista e veículo disponíveis
    const assignment = await this.validationService.findAvailableDriverAndVehicle(
      autoAssignDto.route_id,
      routeDate,
    );

    // Atualizar rota com atribuições
    await this.routesService.update(autoAssignDto.route_id, {
      driver_id: assignment.driver_id,
      vehicle_id: assignment.vehicle_id,
    });

    return {
      route_id: autoAssignDto.route_id,
      route_code: route.route_code,
      driver_id: assignment.driver_id,
      driver_name: assignment.driver_name,
      vehicle_id: assignment.vehicle_id,
      vehicle_plate: assignment.vehicle_plate,
      assignment_reason: assignment.assignment_reason,
      confidence_score: assignment.confidence_score,
    };
  }

  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Listar entregas da rota',
    description: 'Lista todas as entregas (paradas) da rota em ordem de sequência',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de paradas da rota',
    type: [RouteStopResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  async getRouteDeliveries(@Param('id', ParseUUIDPipe) id: string): Promise<RouteStop[]> {
    return this.routesService.getRouteDeliveries(id);
  }

  @Post(':id/deliveries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adicionar entrega à rota',
    description: 'Adiciona uma entrega à rota em uma posição específica ou ao final',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Entrega adicionada com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser editada ou entrega já está em outra rota',
  })
  @ApiNotFoundResponse({
    description: 'Rota ou entrega não encontrada',
  })
  async addDeliveryToRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addDeliveryDto: AddDeliveryToRouteDto,
  ): Promise<RouteStop> {
    return this.routesService.addDeliveryToRoute(
      id,
      addDeliveryDto.delivery_id,
      addDeliveryDto.sequence_order,
      addDeliveryDto.notes,
    );
  }

  @Delete(':id/deliveries/:deliveryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover entrega da rota',
    description: 'Remove uma entrega da rota e reordena as demais',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Entrega removida com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser editada',
  })
  @ApiNotFoundResponse({
    description: 'Rota ou entrega não encontrada',
  })
  async removeDeliveryFromRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<void> {
    return this.routesService.removeDeliveryFromRoute(id, deliveryId);
  }

  @Patch(':id/deliveries/reorder')
  @ApiOperation({
    summary: 'Reordenar entregas da rota',
    description: 'Reordena as entregas da rota manualmente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Entregas reordenadas com sucesso',
    type: [RouteStopResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Rota não pode ser editada ou sequências inválidas',
  })
  @ApiNotFoundResponse({
    description: 'Rota não encontrada',
  })
  async reorderDeliveries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reorderDto: ReorderDeliveriesDto,
  ): Promise<RouteStop[]> {
    return this.routesService.reorderDeliveries(id, reorderDto.stops);
  }
}
