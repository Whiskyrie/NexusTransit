import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
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
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

/**
 * Controller para gerenciamento de logs de auditoria
 *
 * Fornece endpoints REST para consulta e administração de logs de auditoria do sistema
 */
@ApiTags('Audit')
@Controller('audit')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Criar log de auditoria manualmente
   *
   * Este endpoint normalmente é usado apenas para casos especiais,
   * pois a auditoria é feita automaticamente via subscribers
   */
  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar log de auditoria',
    description: 'Cria um novo log de auditoria manualmente (uso interno)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Log de auditoria criado com sucesso',
    type: AuditLogResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async create(@Body() createDto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const log = await this.auditLogService.createLog(createDto);
    return this.mapToResponseDto(log);
  }

  /**
   * Listar logs de auditoria com filtros
   */
  @Get('logs')
  @ApiOperation({
    summary: 'Listar logs de auditoria',
    description: 'Retorna lista paginada de logs de auditoria com filtros opcionais',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'FAILED_LOGIN',
      'ACCESS_DENIED',
    ],
    description: 'Filtrar por ação',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrar por ID do usuário',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs de auditoria',
    schema: {
      properties: {
        logs: {
          type: 'array',
          items: { $ref: '#/components/schemas/AuditLogResponseDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findAll(@Query() queryDto: QueryAuditLogsDto): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const result = await this.auditLogService.findLogs(queryDto);
    return {
      logs: result.logs.map(log => this.mapToResponseDto(log)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  /**
   * Buscar log específico por ID
   */
  @Get('logs/:id')
  @ApiOperation({
    summary: 'Buscar log de auditoria por ID',
    description: 'Retorna detalhes completos de um log de auditoria específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do log de auditoria',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Log de auditoria encontrado',
    type: AuditLogResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Log de auditoria não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AuditLogResponseDto> {
    const log = await this.auditLogService.findLogById(id);

    if (!log) {
      throw new Error(`Log de auditoria com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(log);
  }

  /**
   * Buscar logs de um usuário específico
   */
  @Get('logs/user/:userId')
  @ApiOperation({
    summary: 'Buscar logs de um usuário',
    description: 'Retorna logs de auditoria de um usuário específico',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Número máximo de logs a retornar',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs do usuário encontrados',
    type: [AuditLogResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditLogService.findLogsByUserId(userId, limit);
    return logs.map(log => this.mapToResponseDto(log));
  }

  /**
   * Buscar logs de um recurso específico
   */
  @Get('logs/resource/:resourceType/:resourceId')
  @ApiOperation({
    summary: 'Buscar logs de um recurso',
    description: 'Retorna logs de auditoria de um recurso específico',
  })
  @ApiParam({
    name: 'resourceType',
    description: 'Tipo do recurso (ex: Delivery, Vehicle)',
    type: String,
  })
  @ApiParam({
    name: 'resourceId',
    description: 'ID do recurso',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Número máximo de logs a retornar',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs do recurso encontrados',
    type: [AuditLogResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async findByResource(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditLogService.findLogsByResource(resourceType, resourceId, limit);
    return logs.map(log => this.mapToResponseDto(log));
  }

  /**
   * Obter estatísticas de auditoria
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Obter estatísticas de auditoria',
    description: 'Retorna estatísticas agregadas dos logs de auditoria',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 30,
    description: 'Número de dias para análise (padrão: 30)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas de auditoria',
    schema: {
      properties: {
        totalLogs: { type: 'number', example: 1500 },
        loginAttempts: { type: 'number', example: 250 },
        failedLogins: { type: 'number', example: 10 },
        createOperations: { type: 'number', example: 500 },
        updateOperations: { type: 'number', example: 700 },
        deleteOperations: { type: 'number', example: 50 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  async getStatistics(@Query('days') days?: number): Promise<{
    totalLogs: number;
    loginAttempts: number;
    failedLogins: number;
    createOperations: number;
    updateOperations: number;
    deleteOperations: number;
  }> {
    return this.auditLogService.getStatistics(days);
  }

  /**
   * Limpar logs expirados (apenas administradores)
   */
  @Delete('logs/expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpar logs expirados',
    description: 'Remove logs de auditoria que ultrapassaram o período de retenção (apenas admin)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs expirados removidos com sucesso',
    schema: {
      properties: {
        deleted: { type: 'number', example: 150 },
        message: { type: 'string', example: '150 logs expirados foram removidos' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Apenas administradores podem executar esta operação',
  })
  async deleteExpired(): Promise<{
    deleted: number;
    message: string;
  }> {
    const deleted = await this.auditLogService.deleteExpiredLogs();
    return {
      deleted,
      message: `${deleted} logs expirados foram removidos`,
    };
  }

  /**
   * Mapeia entidade para DTO de resposta
   */
  private mapToResponseDto(log: unknown): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    Object.assign(dto, log);
    return dto;
  }
}
