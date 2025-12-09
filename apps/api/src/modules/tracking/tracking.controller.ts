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
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { TrackingFilterDto } from './dto/tracking-filter.dto';
import { TrackingResponseDto } from './dto/tracking-response.dto';
import { PaginatedResponseDto } from '@nexus/common';

@ApiTags('Tracking')
@Controller('tracking')
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar evento de rastreamento',
    description: 'Registra um novo evento de rastreamento para uma entrega',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evento de rastreamento criado com sucesso',
    type: TrackingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async create(@Body() createDto: CreateTrackingDto): Promise<TrackingResponseDto> {
    return this.trackingService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar eventos de rastreamento',
    description: 'Lista eventos com filtros, paginação e busca',
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
    name: 'delivery_id',
    required: false,
    type: String,
    description: 'Filtrar por ID da entrega',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'IN_TRANSIT',
      'AWAITING_PICKUP',
      'AT_HUB',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELIVERY_FAILED',
      'RETURNING',
      'DELAYED',
      'ON_HOLD',
    ],
    description: 'Filtrar por status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eventos de rastreamento',
    type: [TrackingResponseDto],
  })
  async findAll(
    @Query() filterDto: TrackingFilterDto,
  ): Promise<PaginatedResponseDto<TrackingResponseDto>> {
    return this.trackingService.findAll(filterDto);
  }

  @Get('delivery/:deliveryId')
  @ApiOperation({
    summary: 'Buscar histórico de rastreamento de uma entrega',
    description: 'Retorna todos os eventos de rastreamento de uma entrega específica',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID único da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico de rastreamento encontrado',
    type: [TrackingResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  async findByDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<TrackingResponseDto[]> {
    return this.trackingService.findByDelivery(deliveryId);
  }

  @Get('delivery/:deliveryId/latest')
  @ApiOperation({
    summary: 'Buscar último evento de rastreamento',
    description: 'Retorna o evento mais recente de uma entrega',
  })
  @ApiParam({
    name: 'deliveryId',
    description: 'ID único da entrega',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Último evento encontrado',
    type: TrackingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Nenhum evento encontrado',
  })
  async getLatestEvent(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<TrackingResponseDto | null> {
    return this.trackingService.getLatestEvent(deliveryId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar evento de rastreamento por ID',
    description: 'Retorna detalhes completos de um evento de rastreamento',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do evento de rastreamento',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento encontrado',
    type: TrackingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TrackingResponseDto> {
    return this.trackingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar evento de rastreamento',
    description: 'Atualiza informações de um evento de rastreamento',
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
    type: TrackingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTrackingDto,
  ): Promise<TrackingResponseDto> {
    return this.trackingService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover evento de rastreamento',
    description: 'Soft delete de um evento de rastreamento',
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
    return this.trackingService.remove(id);
  }
}
