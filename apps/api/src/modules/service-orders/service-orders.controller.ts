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
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrderFilterDto } from './dto/service-order-filter.dto';
import { ServiceOrderResponseDto } from './dto/service-order-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { OrderStatus } from './enums/service_order-status';
import { DeliveryResponseDto } from '../deliveries/dto/delivery-response.dto';
import { GenerateDeliveryFromServiceOrderDto } from './dto/generate-delivery-from-service-order.dto';
import { PauseServiceOrderDto } from './dto/pause-service-order.dto';
import { ResumeServiceOrderDto } from './dto/resume-service-order.dto';
import { ServiceOrderWorkflowService } from './services/service-order-workflow.service';

@ApiTags('Service Orders')
@Controller('service-orders')
@ApiBearerAuth()
export class ServiceOrdersController {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly workflowService: ServiceOrderWorkflowService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova ordem de serviço',
    description: 'Cria uma nova ordem de serviço com número único gerado automaticamente',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ordem de serviço criada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async create(@Body() createDto: CreateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar ordens de serviço',
    description: 'Lista ordens com filtros, paginação e busca por texto',
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
    description: 'Busca por título',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de ordens de serviço',
    type: [ServiceOrderResponseDto],
  })
  async findAll(
    @Query() filterDto: ServiceOrderFilterDto,
  ): Promise<PaginatedResponseDto<ServiceOrderResponseDto>> {
    return this.serviceOrdersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar ordem por ID',
    description: 'Retorna detalhes completos da ordem de serviço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem encontrada',
    type: ServiceOrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ordem não encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.findOne(id);
  }

  @Get('number/:orderNumber')
  @ApiOperation({
    summary: 'Buscar ordem por número',
    description: 'Busca ordem pelo número único (ex: OS-2024-00001)',
  })
  @ApiParam({
    name: 'orderNumber',
    description: 'Número da ordem',
    example: 'OS-2024-00001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem encontrada',
    type: ServiceOrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ordem não encontrada',
  })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.findByOrderNumber(orderNumber);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar ordem de serviço',
    description: 'Atualiza campos específicos da ordem',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem atualizada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ordem não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou transição de status inválida',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.update(id, updateDto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar execução da ordem',
    description: 'Marca a ordem como "em execução" e registra horário de início',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem iniciada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem não está no status correto para ser iniciada',
  })
  async startOrder(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.startOrder(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Concluir ordem de serviço',
    description: 'Marca a ordem como concluída com relatório final e custo real',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem concluída com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem não está em execução',
  })
  async completeOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { report?: string; actual_cost?: number },
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.completeOrder(id, body);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar ordem de serviço',
    description: 'Cancela a ordem com motivo obrigatório',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem cancelada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem já está finalizada ou motivo não fornecido',
  })
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ): Promise<ServiceOrderResponseDto> {
    if (!body.reason) {
      throw new Error('Motivo do cancelamento é obrigatório');
    }
    return this.serviceOrdersService.cancelOrder(id, body.reason);
  }

  @Post(':id/generate-delivery')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gerar entrega a partir da ordem de serviço',
    description:
      'Cria automaticamente uma entrega no sistema de logística a partir de uma ordem de serviço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem de serviço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entrega gerada com sucesso',
    type: DeliveryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem não está em status válido ou já possui entrega gerada',
  })
  @ApiNotFoundResponse({
    description: 'Ordem de serviço não encontrada',
  })
  async generateDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() deliveryData: GenerateDeliveryFromServiceOrderDto,
  ): Promise<DeliveryResponseDto> {
    return this.serviceOrdersService.generateDeliveryFromServiceOrder(id, deliveryData);
  }

  @Get(':id/workflow')
  @ApiOperation({
    summary: 'Obter informações do workflow',
    description: 'Retorna status atual e transições disponíveis para a ordem de serviço',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem de serviço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Informações do workflow',
  })
  @ApiNotFoundResponse({
    description: 'Ordem de serviço não encontrada',
  })
  async getWorkflowInfo(@Param('id', ParseUUIDPipe) id: string): Promise<{
    currentStatus: OrderStatus;
    availableTransitions: OrderStatus[];
    isFinal: boolean;
  }> {
    const serviceOrder = await this.serviceOrdersService.findOne(id);
    return this.workflowService.getWorkflowInfo(serviceOrder.status);
  }

  @Post(':id/pause')
  @ApiOperation({
    summary: 'Pausar ordem de serviço',
    description: 'Coloca uma ordem em execução no status ON_HOLD',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem de serviço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem pausada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem não está em execução',
  })
  @ApiNotFoundResponse({
    description: 'Ordem de serviço não encontrada',
  })
  async pauseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PauseServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.pauseOrder(id, body.reason, body.userId);
  }

  @Post(':id/resume')
  @ApiOperation({
    summary: 'Retomar ordem de serviço',
    description: 'Retoma uma ordem pausada voltando para IN_PROGRESS',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem de serviço',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordem retomada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ordem não está pausada',
  })
  @ApiNotFoundResponse({
    description: 'Ordem de serviço não encontrada',
  })
  async resumeOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResumeServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.resumeOrder(id, body.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover ordem de serviço',
    description: 'Soft delete da ordem',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da ordem',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Ordem removida com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Ordem não encontrada',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serviceOrdersService.remove(id);
  }
}
