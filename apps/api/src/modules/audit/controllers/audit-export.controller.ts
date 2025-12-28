import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiProduces,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@nexus/auth';
import type { Response } from 'express';
import { AuditExportAsyncService } from '../services/audit-export-async.service';
import { AuditRequestInterceptor } from '../interceptors/audit-request.interceptor';
import { AuditAccessGuard } from '../guards/audit-access.guard';
import { RequireAuditPermission } from '../decorators/audit-access.decorator';
import { AuditPermission } from '../enums/audit-permission.enum';
import {
  CreateAuditExportDto,
  ExportJobResponseDto,
  ListExportJobsDto,
  ExportFormat,
} from '../dto/audit-export.dto';

/**
 * Interface para usuário autenticado
 */
interface AuthUser {
  id: string;
  email: string;
}

/**
 * Controller de Exportação de Logs de Auditoria
 *
 * Gerencia jobs de exportação assíncrona para grandes volumes de dados.
 * Suporta formatos CSV, JSON e XLSX (Excel).
 *
 * Requer permissão EXPORT_LOGS para acessar.
 */
@ApiTags('Audit Export')
@Controller('audit/export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AuditAccessGuard)
@UseInterceptors(AuditRequestInterceptor)
@RequireAuditPermission(AuditPermission.EXPORT_LOGS)
export class AuditExportController {
  constructor(private readonly exportService: AuditExportAsyncService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar job de exportação',
    description: `
Cria um novo job de exportação assíncrona de logs de auditoria.

**Formatos suportados:**
- \`csv\` - Valores separados por vírgula
- \`json\` - JavaScript Object Notation
- \`xlsx\` - Microsoft Excel (recomendado para grandes volumes)

**Limites:**
- Exportação síncrona (retorno direto): até 10.000 registros
- Exportação assíncrona: até 100.000 registros

**Fluxo:**
1. Envie a requisição com os filtros desejados
2. Receba o ID do job e monitore o status
3. Quando \`status\` for \`COMPLETED\`, faça download do arquivo

O arquivo gerado expira em **24 horas**.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job de exportação criado com sucesso',
    type: ExportJobResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Nenhum registro encontrado com os filtros especificados',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido',
  })
  async createExportJob(
    @Body() dto: CreateAuditExportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ExportJobResponseDto> {
    return this.exportService.createExportJob(dto, user?.id, user?.email);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar jobs de exportação',
    description: `
Lista os jobs de exportação do usuário atual.
Retorna os jobs mais recentes primeiro.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de jobs de exportação',
    type: [ExportJobResponseDto],
  })
  listJobs(@Query() dto: ListExportJobsDto, @CurrentUser() user: AuthUser): ExportJobResponseDto[] {
    return this.exportService.listJobs(dto, user?.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter status do job de exportação',
    description: `
Retorna o status atual de um job de exportação.

**Status possíveis:**
- \`PENDING\` - Aguardando processamento
- \`PROCESSING\` - Em processamento
- \`COMPLETED\` - Concluído (arquivo disponível para download)
- \`FAILED\` - Falhou
- \`EXPIRED\` - Arquivo expirado
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do job de exportação',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do job de exportação',
    type: ExportJobResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Job não encontrado',
  })
  getJobStatus(@Param('id', ParseUUIDPipe) id: string): ExportJobResponseDto {
    return this.exportService.getJobStatus(id);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download do arquivo de exportação',
    description: `
Faz download do arquivo de exportação gerado.

**Requisitos:**
- O job deve estar com status \`COMPLETED\`
- O arquivo não pode estar expirado (válido por 24h)

**Formatos:**
- CSV: \`text/csv\`
- JSON: \`application/json\`
- XLSX: \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do job de exportação',
    type: String,
    format: 'uuid',
  })
  @ApiProduces(
    'text/csv',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Arquivo de exportação',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiNotFoundResponse({
    description: 'Arquivo não encontrado, não concluído ou expirado',
  })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename, contentType } = await this.exportService.getExportFile(id);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancelar job de exportação',
    description: `
Cancela um job de exportação pendente.

**Restrições:**
- Apenas jobs com status \`PENDING\` podem ser cancelados
- Jobs em processamento ou concluídos não podem ser cancelados
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do job de exportação',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Job cancelado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Job não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Job não pode ser cancelado (não está pendente)',
  })
  cancelJob(@Param('id', ParseUUIDPipe) id: string): void {
    this.exportService.cancelJob(id);
  }

  @Get('formats/available')
  @ApiOperation({
    summary: 'Listar formatos de exportação disponíveis',
    description: 'Retorna os formatos de arquivo suportados para exportação.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formatos disponíveis',
    schema: {
      type: 'object',
      properties: {
        formats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'xlsx' },
              name: { type: 'string', example: 'Microsoft Excel' },
              extension: { type: 'string', example: '.xlsx' },
              contentType: {
                type: 'string',
                example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
              recommended: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  getAvailableFormats(): {
    formats: {
      id: string;
      name: string;
      extension: string;
      contentType: string;
      recommended: boolean;
    }[];
  } {
    return {
      formats: [
        {
          id: ExportFormat.XLSX,
          name: 'Microsoft Excel',
          extension: '.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          recommended: true,
        },
        {
          id: ExportFormat.CSV,
          name: 'CSV (Valores Separados por Vírgula)',
          extension: '.csv',
          contentType: 'text/csv',
          recommended: false,
        },
        {
          id: ExportFormat.JSON,
          name: 'JSON (JavaScript Object Notation)',
          extension: '.json',
          contentType: 'application/json',
          recommended: false,
        },
      ],
    };
  }
}
