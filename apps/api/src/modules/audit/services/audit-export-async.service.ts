import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity, AuditService, AuditResponseDto } from '@nexus/audit';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import { format as formatDate, addHours } from 'date-fns';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import {
  ExportFormat,
  ExportJobStatus,
  CreateAuditExportDto,
  ExportJobResponseDto,
  ExportJob,
  ListExportJobsDto,
} from '../dto/audit-export.dto';
import { AUDIT_EXPORT_LIMITS } from '../constants/audit.constants';

/**
 * Service de Exportação Assíncrona de Logs de Auditoria
 *
 * Gerencia jobs de exportação em background para grandes volumes de dados.
 * Suporta formatos CSV, JSON e XLSX (Excel).
 */
@Injectable()
export class AuditExportAsyncService {
  private readonly logger = new Logger(AuditExportAsyncService.name);

  /**
   * Armazenamento em memória dos jobs de exportação
   * Em produção, isso deveria ser Redis ou banco de dados
   */
  private readonly jobs = new Map<string, ExportJob>();

  /**
   * Diretório para arquivos temporários de exportação
   */
  private readonly exportDir = join(tmpdir(), 'nexus-audit-exports');

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    private readonly auditService: AuditService,
  ) {
    // Garantir que o diretório de exportação existe
    void this.ensureExportDir();
    // Limpar jobs expirados periodicamente
    this.scheduleCleanup();
  }

  /**
   * Cria um novo job de exportação assíncrona
   */
  async createExportJob(
    dto: CreateAuditExportDto,
    userId?: string,
    userEmail?: string,
  ): Promise<ExportJobResponseDto> {
    // Verificar limite de registros
    if (dto.maxRecords && dto.maxRecords > AUDIT_EXPORT_LIMITS.MAX_ASYNC_EXPORT) {
      dto.maxRecords = AUDIT_EXPORT_LIMITS.MAX_ASYNC_EXPORT;
    }

    // Contar registros que serão exportados
    const totalRecords = await this.countRecords(dto);

    if (totalRecords === 0) {
      throw new NotFoundException('Nenhum registro encontrado com os filtros especificados');
    }

    // Criar job
    const job: ExportJob = {
      id: uuidv4(),
      status: ExportJobStatus.PENDING,
      format: dto.format,
      filters: {
        action: dto.action,
        category: dto.category,
        userId: dto.userId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        ipAddress: dto.ipAddress,
        search: dto.search,
      },
      options: {
        includeOldValues: dto.includeOldValues ?? true,
        includeNewValues: dto.includeNewValues ?? true,
        includeMetadata: dto.includeMetadata ?? false,
        maxRecords: Math.min(
          dto.maxRecords ?? AUDIT_EXPORT_LIMITS.DEFAULT_EXPORT_LIMIT,
          totalRecords,
        ),
      },
      createdAt: new Date(),
      totalRecords: Math.min(dto.maxRecords ?? totalRecords, totalRecords),
      processedRecords: 0,
      userId,
      userEmail,
    };

    this.jobs.set(job.id, job);

    this.logger.log(`Export job created: ${job.id} - ${totalRecords} records`);

    // Iniciar processamento em background
    void this.processJobInBackground(job.id);

    return this.mapJobToResponse(job);
  }

  /**
   * Obtém status de um job de exportação
   */
  getJobStatus(jobId: string): ExportJobResponseDto {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new NotFoundException(`Job de exportação não encontrado: ${jobId}`);
    }

    return this.mapJobToResponse(job);
  }

  /**
   * Lista jobs de exportação do usuário
   */
  listJobs(dto: ListExportJobsDto, userId?: string): ExportJobResponseDto[] {
    let jobs = Array.from(this.jobs.values());

    // Filtrar por usuário se especificado
    if (userId) {
      jobs = jobs.filter(j => j.userId === userId);
    }

    // Filtrar por status se especificado
    if (dto.status) {
      jobs = jobs.filter(j => j.status === dto.status);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Aplicar limite
    jobs = jobs.slice(0, dto.limit ?? 10);

    return jobs.map(j => this.mapJobToResponse(j));
  }

  /**
   * Obtém o arquivo de exportação para download
   */
  async getExportFile(jobId: string): Promise<{
    buffer: Buffer;
    filename: string;
    contentType: string;
  }> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new NotFoundException(`Job de exportação não encontrado: ${jobId}`);
    }

    if (job.status !== ExportJobStatus.COMPLETED) {
      throw new NotFoundException(`Exportação ainda não concluída. Status: ${job.status}`);
    }

    if (!job.filePath) {
      throw new NotFoundException('Arquivo de exportação não encontrado');
    }

    // Verificar se expirou
    if (job.expiresAt && new Date() > job.expiresAt) {
      job.status = ExportJobStatus.EXPIRED;
      throw new NotFoundException('Arquivo de exportação expirado');
    }

    const buffer = await fs.readFile(job.filePath);
    const filename = this.generateFilename(job.format);
    const contentType = this.getContentType(job.format);

    return { buffer, filename, contentType };
  }

  /**
   * Cancela um job de exportação pendente
   */
  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new NotFoundException(`Job de exportação não encontrado: ${jobId}`);
    }

    if (job.status !== ExportJobStatus.PENDING) {
      throw new Error('Apenas jobs pendentes podem ser cancelados');
    }

    this.jobs.delete(jobId);
    this.logger.log(`Export job cancelled: ${jobId}`);
  }

  // ============= Métodos Privados =============

  /**
   * Processa job em background
   */
  private processJobInBackground(jobId: string): void {
    // Usar setImmediate para não bloquear o event loop
    setImmediate(() => {
      this.processJob(jobId).catch(error => {
        this.logger.error(`Failed to process export job ${jobId}:`, error);
        const job = this.jobs.get(jobId);
        if (job) {
          job.status = ExportJobStatus.FAILED;
          job.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        }
      });
    });
  }

  /**
   * Processa um job de exportação
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    // Atualizar status
    job.status = ExportJobStatus.PROCESSING;
    job.startedAt = new Date();

    this.logger.log(`Processing export job: ${jobId}`);

    try {
      // Buscar logs com paginação
      const logs = await this.fetchLogs(job);

      // Gerar arquivo baseado no formato
      let filePath: string;
      switch (job.format) {
        case ExportFormat.XLSX:
          filePath = await this.exportToXlsx(logs, job);
          break;
        case ExportFormat.CSV:
          filePath = await this.exportToCsv(logs, job);
          break;
        case ExportFormat.JSON:
          filePath = await this.exportToJson(logs, job);
          break;
        default: {
          const exhaustiveCheck: never = job.format;
          throw new Error(`Formato não suportado: ${String(exhaustiveCheck)}`);
        }
      }

      // Obter tamanho do arquivo
      const stats = await fs.stat(filePath);

      // Atualizar job com sucesso
      job.status = ExportJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.filePath = filePath;
      job.fileSize = stats.size;
      job.expiresAt = addHours(new Date(), 24); // Expira em 24h

      this.logger.log(
        `Export job completed: ${jobId} - ${job.processedRecords} records, ${stats.size} bytes`,
      );
    } catch (error) {
      job.status = ExportJobStatus.FAILED;
      job.completedAt = new Date();
      job.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw error;
    }
  }

  /**
   * Busca logs com base nos filtros do job
   */
  private async fetchLogs(job: ExportJob): Promise<AuditResponseDto[]> {
    const batchSize = 1000;
    const allLogs: AuditResponseDto[] = [];
    let page = 1;

    while (allLogs.length < job.options.maxRecords) {
      const result = await this.auditService.findAll({
        ...job.filters,
        page,
        limit: Math.min(batchSize, job.options.maxRecords - allLogs.length),
      });

      if (result.data.length === 0) {
        break;
      }

      allLogs.push(...result.data);
      job.processedRecords = allLogs.length;

      if (result.data.length < batchSize) {
        break;
      }
      page++;
    }

    return allLogs;
  }

  /**
   * Exporta para XLSX (Excel)
   */
  private async exportToXlsx(logs: AuditResponseDto[], job: ExportJob): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NexusTransit';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Logs de Auditoria', {
      properties: { tabColor: { argb: '4F81BD' } },
    });

    // Definir colunas
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'ID', key: 'id', width: 40 },
      { header: 'Ação', key: 'action', width: 15 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Usuário ID', key: 'userId', width: 40 },
      { header: 'Email', key: 'userEmail', width: 30 },
      { header: 'Papel', key: 'userRole', width: 15 },
      { header: 'Tipo Recurso', key: 'resourceType', width: 20 },
      { header: 'ID Recurso', key: 'resourceId', width: 40 },
      { header: 'IP', key: 'ipAddress', width: 15 },
      { header: 'Método', key: 'requestMethod', width: 10 },
      { header: 'URL', key: 'requestUrl', width: 50 },
      { header: 'Status', key: 'statusCode', width: 10 },
      { header: 'Tempo (ms)', key: 'executionTimeMs', width: 12 },
      { header: 'Descrição', key: 'description', width: 50 },
      { header: 'Data/Hora', key: 'createdAt', width: 20 },
    ];

    if (job.options.includeOldValues) {
      columns.push({ header: 'Valores Anteriores', key: 'oldValues', width: 50 });
    }
    if (job.options.includeNewValues) {
      columns.push({ header: 'Novos Valores', key: 'newValues', width: 50 });
    }
    if (job.options.includeMetadata) {
      columns.push({ header: 'Metadata', key: 'metadata', width: 50 });
    }

    worksheet.columns = columns;

    // Estilizar header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Adicionar dados
    for (const log of logs) {
      const row: Record<string, unknown> = {
        id: log.id,
        action: log.action,
        category: log.category,
        userId: log.userId ?? '',
        userEmail: log.userEmail ?? '',
        userRole: log.userRole ?? '',
        resourceType: log.resourceType ?? '',
        resourceId: log.resourceId ?? '',
        ipAddress: log.ipAddress ?? '',
        requestMethod: log.requestMethod ?? '',
        requestUrl: log.requestUrl ?? '',
        statusCode: log.statusCode ?? '',
        executionTimeMs: log.executionTimeMs ?? '',
        description: log.description ?? '',
        createdAt: formatDate(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      };

      if (job.options.includeOldValues) {
        row.oldValues = log.oldValues ? JSON.stringify(log.oldValues) : '';
      }
      if (job.options.includeNewValues) {
        row.newValues = log.newValues ? JSON.stringify(log.newValues) : '';
      }
      if (job.options.includeMetadata) {
        row.metadata = log.metadata ? JSON.stringify(log.metadata) : '';
      }

      worksheet.addRow(row);
    }

    // Aplicar filtros automáticos
    worksheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: columns.length },
    };

    // Congelar primeira linha
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Salvar arquivo
    const filePath = join(this.exportDir, `${job.id}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }

  /**
   * Exporta para CSV
   */
  private async exportToCsv(logs: AuditResponseDto[], job: ExportJob): Promise<string> {
    const filePath = join(this.exportDir, `${job.id}.csv`);

    const headers: { id: string; title: string }[] = [
      { id: 'id', title: 'ID' },
      { id: 'action', title: 'Ação' },
      { id: 'category', title: 'Categoria' },
      { id: 'userId', title: 'ID do Usuário' },
      { id: 'userEmail', title: 'Email' },
      { id: 'userRole', title: 'Papel' },
      { id: 'resourceType', title: 'Tipo Recurso' },
      { id: 'resourceId', title: 'ID Recurso' },
      { id: 'ipAddress', title: 'IP' },
      { id: 'requestMethod', title: 'Método' },
      { id: 'requestUrl', title: 'URL' },
      { id: 'statusCode', title: 'Status' },
      { id: 'executionTimeMs', title: 'Tempo (ms)' },
      { id: 'description', title: 'Descrição' },
      { id: 'createdAt', title: 'Data/Hora' },
    ];

    if (job.options.includeOldValues) {
      headers.push({ id: 'oldValues', title: 'Valores Anteriores' });
    }
    if (job.options.includeNewValues) {
      headers.push({ id: 'newValues', title: 'Novos Valores' });
    }
    if (job.options.includeMetadata) {
      headers.push({ id: 'metadata', title: 'Metadata' });
    }

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    const records = logs.map(log => {
      const record: Record<string, string | number> = {
        id: log.id,
        action: log.action,
        category: log.category,
        userId: log.userId ?? '',
        userEmail: log.userEmail ?? '',
        userRole: log.userRole ?? '',
        resourceType: log.resourceType ?? '',
        resourceId: log.resourceId ?? '',
        ipAddress: log.ipAddress ?? '',
        requestMethod: log.requestMethod ?? '',
        requestUrl: log.requestUrl ?? '',
        statusCode: log.statusCode ?? '',
        executionTimeMs: log.executionTimeMs ?? '',
        description: log.description ?? '',
        createdAt: formatDate(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      };

      if (job.options.includeOldValues) {
        record.oldValues = log.oldValues ? JSON.stringify(log.oldValues) : '';
      }
      if (job.options.includeNewValues) {
        record.newValues = log.newValues ? JSON.stringify(log.newValues) : '';
      }
      if (job.options.includeMetadata) {
        record.metadata = log.metadata ? JSON.stringify(log.metadata) : '';
      }

      return record;
    });

    await csvWriter.writeRecords(records);

    return filePath;
  }

  /**
   * Exporta para JSON
   */
  private async exportToJson(logs: AuditResponseDto[], job: ExportJob): Promise<string> {
    const filePath = join(this.exportDir, `${job.id}.json`);

    const data = logs.map(log => {
      const record: Record<string, unknown> = {
        id: log.id,
        action: log.action,
        category: log.category,
        userId: log.userId,
        userEmail: log.userEmail,
        userRole: log.userRole,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        ipAddress: log.ipAddress,
        requestMethod: log.requestMethod,
        requestUrl: log.requestUrl,
        statusCode: log.statusCode,
        executionTimeMs: log.executionTimeMs,
        description: log.description,
        createdAt: log.created_at,
      };

      if (job.options.includeOldValues) {
        record.oldValues = log.oldValues;
      }
      if (job.options.includeNewValues) {
        record.newValues = log.newValues;
      }
      if (job.options.includeMetadata) {
        record.metadata = log.metadata;
      }

      return record;
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportId: job.id,
      filters: job.filters,
      totalRecords: logs.length,
      data,
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

    return filePath;
  }

  /**
   * Conta registros que serão exportados
   */
  private async countRecords(dto: CreateAuditExportDto): Promise<number> {
    const result = await this.auditService.findAll({
      ...dto,
      page: 1,
      limit: 1,
    });
    return result.meta.total;
  }

  /**
   * Mapeia job interno para DTO de resposta
   */
  private mapJobToResponse(job: ExportJob): ExportJobResponseDto {
    const response: ExportJobResponseDto = {
      id: job.id,
      status: job.status,
      format: job.format,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      errorMessage: job.errorMessage,
      fileSize: job.fileSize,
      expiresAt: job.expiresAt,
    };

    // Calcular progresso
    if (job.totalRecords && job.processedRecords !== undefined) {
      response.progress = Math.round((job.processedRecords / job.totalRecords) * 100);
    }

    // Adicionar URL de download se completo
    if (job.status === ExportJobStatus.COMPLETED) {
      response.downloadUrl = `/audit/export/${job.id}/download`;
    }

    return response;
  }

  /**
   * Gera nome do arquivo para download
   */
  private generateFilename(format: ExportFormat): string {
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd-HHmmss');
    return `audit-logs-${timestamp}.${format}`;
  }

  /**
   * Retorna content-type baseado no formato
   */
  private getContentType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.CSV:
        return 'text/csv';
      case ExportFormat.JSON:
        return 'application/json';
      case ExportFormat.XLSX:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Garante que o diretório de exportação existe
   */
  private async ensureExportDir(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create export directory:', error);
    }
  }

  /**
   * Agenda limpeza periódica de jobs expirados
   */
  private scheduleCleanup(): void {
    // Limpar a cada hora
    setInterval(
      () => {
        void this.cleanupExpiredJobs();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Limpa jobs e arquivos expirados
   */
  private async cleanupExpiredJobs(): Promise<void> {
    const now = new Date();
    let cleaned = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.expiresAt && now > job.expiresAt) {
        // Remover arquivo se existir
        if (job.filePath) {
          try {
            await fs.unlink(job.filePath);
          } catch {
            // Arquivo pode já ter sido removido
          }
        }

        this.jobs.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired export jobs`);
    }
  }
}
