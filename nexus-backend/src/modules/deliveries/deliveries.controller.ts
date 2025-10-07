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
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveryFilterDto } from './dto/delivery-filter.dto';
import { DeliveryResponseDto } from './dto/delivery-response.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateDeliveryAttemptDto } from './dto/delivery-attempt.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DeliveryStatus } from './enums/delivery-status.enum';
import { DeliveryPriority } from './enums/delivery-priority.enum';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';

@ApiTags('Deliveries')
@Controller('deliveries')
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova entrega',
    description:
      'Cria uma nova entrega no sistema com validações completas de dados e relacionamentos',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entrega criada com sucesso',
    type: DeliveryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'Conflito de dados (cliente/motorista/veículo não encontrado)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para criar entregas',
  })
  async create(@Body() createDeliveryDto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    return this.deliveriesService.create(createDeliveryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar entregas',
    description: 'Lista entregas com filtros avançados, paginação e ordenação',
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
    name: 'sort_by',
    required: false,
    enum: [
      'created_at',
      'updated_at',
      'scheduled_delivery_at',
      'priority',
      'status',
      'tracking_code',
    ],
    example: 'created_at',
    description: 'Campo de ordenação',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Direção da ordenação',
  })
  @ApiQuery({
    name: 'tracking_code',
    required: false,
    type: String,
    example: 'NEX123456789BR',
    description: 'Buscar por código de rastreamento',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: DeliveryStatus,
    example: 'IN_TRANSIT',
    description: 'Filtrar por status da entrega',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: DeliveryPriority,
    example: 'HIGH',
    description: 'Filtrar por prioridade da entrega',
  })
  @ApiQuery({
    name: 'customer_id',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filtrar por ID do cliente',
  })
  @ApiQuery({
    name: 'driver_id',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Filtrar por ID do motorista',
  })
  @ApiQuery({
    name: 'vehicle_id',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Filtrar por ID do veículo',
  })
  @ApiQuery({
    name: 'delivery_city',
    required: false,
    type: String,
    example: 'São Paulo',
    description: 'Filtrar por cidade de entrega',
  })
  @ApiQuery({
    name: 'delivery_state',
    required: false,
    type: String,
    example: 'SP',
    description: 'Filtrar por estado de entrega',
  })
  @ApiQuery({
    name: 'overdue',
    required: false,
    type: Boolean,
    example: false,
    description: 'Apenas entregas atrasadas',
  })
  @ApiQuery({
    name: 'today',
    required: false,
    type: Boolean,
    example: false,
    description: 'Apenas entregas de hoje',
  })
  @ApiQuery({
    name: 'active_only',
    required: false,
    type: Boolean,
    example: true,
    description: 'Apenas entregas ativas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de entregas retornada com sucesso',
    type: PaginatedResponseDto<DeliveryResponseDto>,
  })
  async findAll(
    @Query() filterDto: DeliveryFilterDto,
  ): Promise<PaginatedResponseDto<DeliveryResponseDto>> {
    return this.deliveriesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar entrega por ID',
    description: 'Retorna os detalhes completos de uma entrega específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entrega encontrada com sucesso',
    type: DeliveryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DeliveryResponseDto> {
    return this.deliveriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar entrega',
    description: 'Atualiza os dados de uma entrega existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entrega atualizada com sucesso',
    type: DeliveryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar entregas',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.update(id, updateDeliveryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover entrega',
    description: 'Remove uma entrega do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Entrega removida com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para remover entregas',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deliveriesService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Alterar status da entrega',
    description: 'Altera o status de uma entrega com validação de transições e histórico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status alterado com sucesso',
    type: DeliveryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Transição de status inválida ou dados inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para alterar status',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.changeStatus(id, changeStatusDto);
  }

  @Post(':id/attempts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar tentativa de entrega',
    description: 'Registra uma nova tentativa de entrega com detalhes e evidências',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tentativa registrada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Entrega não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou motorista não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async createAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createAttemptDto: CreateDeliveryAttemptDto,
  ): Promise<DeliveryAttempt> {
    return this.deliveriesService.createAttempt(id, createAttemptDto);
  }
}
