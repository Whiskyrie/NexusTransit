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
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteFilterDto } from './dto/filter-route.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CancelRouteDto } from './dto/cancel_route.dto';
import { RouteStatusInterceptor } from './interceptors/route-status.interceptor';
import { RouteValidationInterceptor } from './interceptors/route-validation.interceptor';

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
  constructor(private readonly routesService: RoutesService) {}

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
}
