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
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { TrackingEventsService } from '../services/tracking-events.service';
import { TrackingCalculationService } from '../services/tracking-calculation.service';
import {
  CreateTrackingEventDto,
  UpdateTrackingEventDto,
  TrackingEventFilterDto,
  TrackingEventResponseDto,
  PaginatedResponseDto,
  BatchTrackingEventsDto,
} from '../dto';

/**
 * Controller para gerenciamento de eventos de rastreamento
 */
@ApiTags('Tracking Events')
@Controller('tracking/events')
@ApiBearerAuth()
export class TrackingEventsController {
  constructor(
    private readonly trackingEventsService: TrackingEventsService,
    private readonly trackingCalculationService: TrackingCalculationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar evento de rastreamento',
    description:
      'Registra um novo evento de rastreamento para uma entrega com validação de sequência',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evento criado com sucesso',
    type: TrackingEventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sequência de eventos incorreta',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async create(@Body() createDto: CreateTrackingEventDto): Promise<TrackingEventResponseDto> {
    return this.trackingEventsService.create(createDto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar eventos em lote',
    description:
      'Registra múltiplos eventos de rastreamento de uma vez (útil para sincronização offline)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Eventos criados com sucesso (alguns podem ter falhado)',
    type: [TrackingEventResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos em um ou mais eventos',
  })
  async createBatch(@Body() batchDto: BatchTrackingEventsDto): Promise<TrackingEventResponseDto[]> {
    return this.trackingEventsService.createBatch(batchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar eventos de rastreamento',
    description: 'Lista eventos com filtros avançados, paginação e busca',
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
    description: 'Buscar no endereço',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eventos de rastreamento',
    type: PaginatedResponseDto<TrackingEventResponseDto>,
  })
  async findAll(
    @Query() filterDto: TrackingEventFilterDto,
  ): Promise<PaginatedResponseDto<TrackingEventResponseDto>> {
    return this.trackingEventsService.findAll(filterDto);
  }

  @Get('delivery/:deliveryId')
  @ApiOperation({
    summary: 'Histórico de eventos de uma entrega',
    description: 'Retorna todos os eventos de rastreamento para uma entrega específica',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico de eventos',
    type: [TrackingEventResponseDto],
  })
  async findByDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<TrackingEventResponseDto[]> {
    return this.trackingEventsService.findByDelivery(deliveryId);
  }

  @Get('delivery/:deliveryId/latest')
  @ApiOperation({
    summary: 'Último evento de uma entrega',
    description: 'Retorna o evento de rastreamento mais recente para uma entrega',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Último evento encontrado',
    type: TrackingEventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Nenhum evento encontrado para a entrega',
  })
  async findLatestByDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<TrackingEventResponseDto> {
    return this.trackingEventsService.findLatestByDelivery(deliveryId);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Entregas em trânsito',
    description: 'Retorna todas as entregas atualmente em trânsito ou próximas da entrega',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de entregas ativas',
    type: [TrackingEventResponseDto],
  })
  async findActiveDeliveries(): Promise<TrackingEventResponseDto[]> {
    return this.trackingEventsService.findActiveDeliveries();
  }

  @Get('driver/:driverId/current')
  @ApiOperation({
    summary: 'Localização atual do motorista',
    description: 'Retorna a localização mais recente de um motorista específico',
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID do motorista',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localização atual do motorista',
    type: TrackingEventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Localização não encontrada para o motorista',
  })
  async findDriverCurrentLocation(
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ): Promise<TrackingEventResponseDto> {
    return this.trackingEventsService.findDriverCurrentLocation(driverId);
  }

  @Get('route/:routeId/progress')
  @ApiOperation({
    summary: 'Progresso da rota',
    description: 'Retorna todos os eventos de rastreamento para uma rota específica',
  })
  @ApiParam({
    name: 'routeId',
    description: 'ID da rota',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progresso da rota',
    type: [TrackingEventResponseDto],
  })
  async findRouteProgress(
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<TrackingEventResponseDto[]> {
    return this.trackingEventsService.findRouteProgress(routeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar evento por ID',
    description: 'Retorna detalhes completos de um evento de rastreamento',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do evento',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento encontrado',
    type: TrackingEventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TrackingEventResponseDto> {
    return this.trackingEventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar evento',
    description: 'Atualiza campos específicos de um evento de rastreamento',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do evento',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento atualizado com sucesso',
    type: TrackingEventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTrackingEventDto,
  ): Promise<TrackingEventResponseDto> {
    return this.trackingEventsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover evento',
    description: 'Remove um evento de rastreamento (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do evento',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Evento removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.trackingEventsService.remove(id);
  }

  // ========== Endpoints de Cálculos Geográficos ==========

  @Get('distance/:eventId1/:eventId2')
  @ApiOperation({
    summary: 'Calcular distância entre dois eventos',
    description: 'Calcula a distância geográfica entre dois eventos de rastreamento usando PostGIS',
  })
  @ApiParam({
    name: 'eventId1',
    description: 'ID do primeiro evento',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'eventId2',
    description: 'ID do segundo evento',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distância calculada com sucesso',
    schema: {
      type: 'object',
      properties: {
        distance_meters: { type: 'number', example: 1500.25 },
        distance_km: { type: 'number', example: 1.5 },
      },
    },
  })
  async calculateDistance(
    @Param('eventId1', ParseUUIDPipe) eventId1: string,
    @Param('eventId2', ParseUUIDPipe) eventId2: string,
  ) {
    return this.trackingCalculationService.calculateDistanceBetweenEvents(eventId1, eventId2);
  }

  @Get('delivery/:deliveryId/total-distance')
  @ApiOperation({
    summary: 'Calcular distância total percorrida',
    description: 'Calcula a distância total percorrida em uma entrega baseada em todos os eventos',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distância total calculada',
    schema: {
      type: 'object',
      properties: {
        distance_meters: { type: 'number', example: 12500.75 },
        distance_km: { type: 'number', example: 12.5 },
      },
    },
  })
  async calculateTotalDistance(@Param('deliveryId', ParseUUIDPipe) deliveryId: string) {
    return this.trackingCalculationService.calculateTotalDistance(deliveryId);
  }

  @Get('delivery/:deliveryId/eta')
  @ApiOperation({
    summary: 'Calcular ETA (Estimated Time of Arrival)',
    description: 'Calcula o tempo estimado de chegada baseado na posição atual e velocidade média',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'destinationLat',
    required: true,
    type: Number,
    example: -23.5505,
    description: 'Latitude do destino',
  })
  @ApiQuery({
    name: 'destinationLon',
    required: true,
    type: Number,
    example: -46.6333,
    description: 'Longitude do destino',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ETA calculado com sucesso',
    schema: {
      type: 'object',
      properties: {
        estimated_arrival: { type: 'string', format: 'date-time', example: '2024-12-18T14:30:00Z' },
        estimated_duration_minutes: { type: 'number', example: 45 },
        average_speed_kmh: { type: 'number', example: 42.5 },
        remaining_distance_km: { type: 'number', example: 31.75 },
      },
    },
  })
  async calculateETA(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Query('destinationLat') destinationLat: number,
    @Query('destinationLon') destinationLon: number,
  ) {
    return this.trackingCalculationService.calculateETA(
      deliveryId,
      Number(destinationLat),
      Number(destinationLon),
    );
  }

  @Get('delivery/:deliveryId/average-speed')
  @ApiOperation({
    summary: 'Calcular velocidade média',
    description: 'Calcula a velocidade média da entrega baseada nos eventos recentes',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Velocidade média calculada',
    schema: {
      type: 'object',
      properties: {
        average_speed_kmh: { type: 'number', example: 45.2 },
      },
    },
  })
  async calculateAverageSpeed(@Param('deliveryId', ParseUUIDPipe) deliveryId: string) {
    const speed = await this.trackingCalculationService.calculateAverageSpeed(deliveryId);
    return { average_speed_kmh: speed };
  }

  @Post('delivery/:deliveryId/detect-delay')
  @ApiOperation({
    summary: 'Detectar atraso',
    description: 'Verifica se a entrega está atrasada comparando ETA com horário esperado',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado da detecção de atraso',
    schema: {
      type: 'object',
      properties: {
        is_delayed: { type: 'boolean', example: true },
        delay_minutes: { type: 'number', example: 25 },
        expected_arrival: { type: 'string', format: 'date-time' },
        estimated_arrival: { type: 'string', format: 'date-time' },
      },
    },
  })
  async detectDelay(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() body: { expected_arrival: string; destination_lat: number; destination_lon: number },
  ) {
    return this.trackingCalculationService.detectDelay(
      deliveryId,
      new Date(body.expected_arrival),
      body.destination_lat,
      body.destination_lon,
    );
  }

  @Get('delivery/:deliveryId/unscheduled-stops')
  @ApiOperation({
    summary: 'Detectar paradas não programadas',
    description: 'Identifica paradas não previstas durante a rota baseado em padrões de velocidade',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de paradas não programadas detectadas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          has_stop: { type: 'boolean', example: true },
          stop_duration_minutes: { type: 'number', example: 15 },
          stop_location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: -23.5505 },
              longitude: { type: 'number', example: -46.6333 },
            },
          },
          stop_start_time: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async detectUnscheduledStops(@Param('deliveryId', ParseUUIDPipe) deliveryId: string) {
    return this.trackingCalculationService.detectUnscheduledStops(deliveryId);
  }

  @Get('delivery/:deliveryId/near-destination')
  @ApiOperation({
    summary: 'Verificar proximidade do destino',
    description: 'Verifica se o motorista está próximo do destino (dentro de 2km)',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'destinationLat',
    required: true,
    type: Number,
    example: -23.5505,
    description: 'Latitude do destino',
  })
  @ApiQuery({
    name: 'destinationLon',
    required: true,
    type: Number,
    example: -46.6333,
    description: 'Longitude do destino',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status de proximidade',
    schema: {
      type: 'object',
      properties: {
        is_near_destination: { type: 'boolean', example: true },
      },
    },
  })
  async checkNearDestination(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Query('destinationLat') destinationLat: number,
    @Query('destinationLon') destinationLon: number,
  ) {
    const isNear = await this.trackingCalculationService.isNearDestination(
      deliveryId,
      Number(destinationLat),
      Number(destinationLon),
    );
    return { is_near_destination: isNear };
  }

  @Get('delivery/:deliveryId/has-arrived')
  @ApiOperation({
    summary: 'Verificar se chegou ao destino',
    description: 'Verifica se o motorista chegou ao destino (dentro de 100m)',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'destinationLat',
    required: true,
    type: Number,
    example: -23.5505,
    description: 'Latitude do destino',
  })
  @ApiQuery({
    name: 'destinationLon',
    required: true,
    type: Number,
    example: -46.6333,
    description: 'Longitude do destino',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status de chegada',
    schema: {
      type: 'object',
      properties: {
        has_arrived: { type: 'boolean', example: true },
      },
    },
  })
  async checkArrival(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Query('destinationLat') destinationLat: number,
    @Query('destinationLon') destinationLon: number,
  ) {
    const hasArrived = await this.trackingCalculationService.hasArrived(
      deliveryId,
      Number(destinationLat),
      Number(destinationLon),
    );
    return { has_arrived: hasArrived };
  }
}
