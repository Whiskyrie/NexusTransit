import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
  Res,
  StreamableFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiProduces,
} from '@nestjs/swagger';
import {
  AuditService,
  AuditFilterDto,
  AuditResponseDto,
  AuditStatisticsDto,
  AuditAction,
  AuditExportService,
  AuditExportDto,
  ExportFormat,
} from '@nexus/audit';
import { PaginatedResponseDto } from '@nexus/common';
import { JwtAuthGuard } from '@nexus/auth';
import type { Response, Request } from 'express';
import { AuditAccessGuard } from './guards/audit-access.guard';
import { AuditOwnerGuard, getAuditFilter } from './guards/audit-owner.guard';
import { RequireAuditPermission } from './decorators/audit-access.decorator';
import { AuditPermission } from './enums/audit-permission.enum';

/**
 * Controller principal de Auditoria
 *
 * Fornece endpoints REST para consulta de logs de auditoria.
 * Aplica filtro de owner automaticamente para usuários sem permissão VIEW_ALL_LOGS.
 */
@ApiTags('Audit')
@Controller('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AuditAccessGuard, AuditOwnerGuard)
@RequireAuditPermission(AuditPermission.VIEW_LOGS)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditExportService: AuditExportService,
  ) {}

  @Get('logs')
  @ApiOperation({
    summary: 'Listar logs de auditoria',
    description:
      'Lista logs de auditoria com filtros avançados, paginação e busca textual. Permite filtrar por ação, categoria, usuário, entidade, período, IP e mais.',
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
    name: 'action',
    required: false,
    enum: AuditAction,
    description: 'Filtrar por ação',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrar por ID do usuário',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    type: String,
    description: 'Filtrar por tipo de entidade',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data de início (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data de fim (ISO 8601)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca textual em descrição e metadata',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs de auditoria',
    type: AuditResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para visualizar logs',
  })
  async findAll(
    @Query() filterDto: AuditFilterDto,
    @Req() request: Request,
  ): Promise<PaginatedResponseDto<AuditResponseDto>> {
    // Aplicar filtro de owner se necessário
    const auditFilter = getAuditFilter(request);
    const finalFilter = { ...filterDto };

    if (auditFilter.restrictToOwner && auditFilter.userId) {
      finalFilter.userId = auditFilter.userId;
    }

    return this.auditService.findAll(finalFilter);
  }

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
    type: AuditResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Log de auditoria não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AuditResponseDto> {
    return this.auditService.findOne(id);
  }

  @Get('entity/:resourceType/:resourceId')
  @ApiOperation({
    summary: 'Histórico de auditoria de uma entidade',
    description:
      'Retorna todos os logs de auditoria relacionados a uma entidade específica, ordenados por data decrescente',
  })
  @ApiParam({
    name: 'resourceType',
    description: 'Tipo da entidade (ex: Vehicle, Driver, Customer)',
    type: String,
    example: 'Vehicle',
  })
  @ApiParam({
    name: 'resourceId',
    description: 'ID da entidade',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico da entidade',
    type: [AuditResponseDto],
  })
  async findByEntity(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ): Promise<AuditResponseDto[]> {
    return this.auditService.findByEntity(resourceType, resourceId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Ações de auditoria por usuário',
    description:
      'Retorna todos os logs de auditoria de ações executadas por um usuário específico (últimas 100 ações)',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ações do usuário',
    type: [AuditResponseDto],
  })
  async findByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<AuditResponseDto[]> {
    return this.auditService.findByUser(userId);
  }

  @Get('action/:action')
  @ApiOperation({
    summary: 'Logs de auditoria por tipo de ação',
    description: 'Retorna logs filtrados por tipo de ação (CREATE, UPDATE, DELETE, etc.)',
  })
  @ApiParam({
    name: 'action',
    description: 'Tipo de ação',
    enum: AuditAction,
    example: AuditAction.UPDATE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs da ação especificada',
    type: [AuditResponseDto],
  })
  async findByAction(@Param('action') action: AuditAction): Promise<AuditResponseDto[]> {
    return this.auditService.findByAction(action);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas de auditoria',
    description:
      'Retorna estatísticas agregadas dos logs de auditoria: total, por ação, por categoria, top usuários, top entidades, tempo médio de execução, taxa de erro e dados por dia',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Período de análise',
    example: 'week',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas de auditoria',
    type: AuditStatisticsDto,
  })
  async getStatistics(
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<AuditStatisticsDto> {
    return this.auditService.getStatistics(period);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Exportar logs de auditoria',
    description:
      'Exporta logs de auditoria em formato CSV ou JSON com os mesmos filtros disponíveis na listagem',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ExportFormat,
    description: 'Formato de exportação',
    example: ExportFormat.CSV,
  })
  @ApiQuery({
    name: 'includeOldValues',
    required: false,
    type: Boolean,
    description: 'Incluir valores antigos',
    example: true,
  })
  @ApiQuery({
    name: 'includeNewValues',
    required: false,
    type: Boolean,
    description: 'Incluir valores novos',
    example: true,
  })
  @ApiQuery({
    name: 'includeMetadata',
    required: false,
    type: Boolean,
    description: 'Incluir metadata',
    example: false,
  })
  @ApiProduces('text/csv', 'application/json')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Arquivo de exportação gerado com sucesso',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportLogs(
    @Query() exportDto: AuditExportDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Buscar logs com os filtros
    const result = await this.auditService.findAll(exportDto);

    // Exportar no formato solicitado
    const { buffer, contentType, filename } = await this.auditExportService.export(
      result.data,
      exportDto.format,
      {
        includeOldValues: exportDto.includeOldValues,
        includeNewValues: exportDto.includeNewValues,
        includeMetadata: exportDto.includeMetadata,
      },
    );

    // Configurar headers de resposta
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }
}
