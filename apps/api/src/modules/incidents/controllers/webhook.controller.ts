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
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookFilterDto,
  WebhookResponseDto,
  WebhookLogFilterDto,
  WebhookLogResponseDto,
} from '../dto';
import { PaginatedResponseDto } from '@nexus/common';

@ApiTags('Webhooks')
@Controller('incidents/webhooks')
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo webhook',
    description:
      'Cria uma nova configuração de webhook para receber notificações de eventos de incidentes',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Webhook criado com sucesso',
    type: WebhookResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para criar webhooks',
  })
  async create(@Body() createDto: CreateWebhookDto): Promise<WebhookResponseDto> {
    return this.webhookService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar webhooks',
    description: 'Lista webhooks com filtros, paginação e busca',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de webhooks',
    type: [WebhookResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findAll(
    @Query() filterDto: WebhookFilterDto,
  ): Promise<PaginatedResponseDto<WebhookResponseDto>> {
    return this.webhookService.findAll(filterDto);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Listar logs de webhooks',
    description: 'Lista histórico de execuções de webhooks com filtros e paginação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs de webhooks',
    type: [WebhookLogResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findLogs(
    @Query() filterDto: WebhookLogFilterDto,
  ): Promise<PaginatedResponseDto<WebhookLogResponseDto>> {
    return this.webhookService.findLogs(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar webhook por ID',
    description: 'Retorna detalhes completos de um webhook',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do webhook',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook encontrado',
    type: WebhookResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Webhook não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookResponseDto> {
    return this.webhookService.findOne(id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Testar webhook',
    description: 'Envia um payload de teste para o webhook e retorna o resultado da execução',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do webhook',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook testado com sucesso',
    type: WebhookLogResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Webhook não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async test(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookLogResponseDto> {
    return this.webhookService.test(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar webhook',
    description: 'Atualiza campos específicos de um webhook',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do webhook',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook atualizado com sucesso',
    type: WebhookResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Webhook não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover webhook',
    description: 'Soft delete de um webhook',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do webhook',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Webhook removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Webhook não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.webhookService.remove(id);
  }
}
