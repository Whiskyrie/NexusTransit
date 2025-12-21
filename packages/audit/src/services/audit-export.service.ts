import { Injectable, Logger } from "@nestjs/common";
import { createObjectCsvWriter } from "csv-writer";
import { AuditResponseDto, ExportFormat } from "../dto";
import { format as formatDate } from "date-fns";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";

/**
 * Interface para registro de exportação
 */
interface ExportRecord {
  id: string;
  action: string;
  category: string;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  resourceType?: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  requestMethod?: string | null;
  requestUrl?: string | null;
  statusCode?: number | null;
  executionTimeMs?: number | null;
  description?: string | null;
  created_at: Date;
  changedFields?: string[];
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
}

@Injectable()
export class AuditExportService {
  private readonly logger = new Logger(AuditExportService.name);

  /**
   * Export audit logs to CSV format
   */
  async exportToCsv(
    logs: AuditResponseDto[],
    options: {
      includeOldValues?: boolean;
      includeNewValues?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<Buffer> {
    const { includeOldValues = true, includeNewValues = true, includeMetadata = false } = options;

    // Create temporary file
    const tempFile = join(tmpdir(), `audit-export-${Date.now()}.csv`);

    // Define CSV headers
    const headers: Array<{ id: string; title: string }> = [
      { id: "id", title: "ID" },
      { id: "action", title: "Ação" },
      { id: "category", title: "Categoria" },
      { id: "userId", title: "ID do Usuário" },
      { id: "userEmail", title: "Email do Usuário" },
      { id: "userRole", title: "Papel do Usuário" },
      { id: "resourceType", title: "Tipo de Recurso" },
      { id: "resourceId", title: "ID do Recurso" },
      { id: "ipAddress", title: "IP" },
      { id: "requestMethod", title: "Método HTTP" },
      { id: "requestUrl", title: "URL" },
      { id: "statusCode", title: "Status Code" },
      { id: "executionTimeMs", title: "Tempo (ms)" },
      { id: "description", title: "Descrição" },
      { id: "created_at", title: "Data/Hora" },
    ];

    if (includeOldValues) {
      headers.push({ id: "oldValues", title: "Valores Anteriores" });
    }

    if (includeNewValues) {
      headers.push({ id: "newValues", title: "Novos Valores" });
    }

    if (includeMetadata) {
      headers.push({ id: "metadata", title: "Metadata" });
    }

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: tempFile,
      header: headers,
    });

    // Transform logs for CSV
    const records = logs.map((log) => ({
      id: log.id,
      action: log.action,
      category: log.category,
      userId: log.userId || "",
      userEmail: log.userEmail || "",
      userRole: log.userRole || "",
      resourceType: log.resourceType,
      resourceId: log.resourceId || "",
      ipAddress: log.ipAddress || "",
      requestMethod: log.requestMethod || "",
      requestUrl: log.requestUrl || "",
      statusCode: log.statusCode || "",
      executionTimeMs: log.executionTimeMs || "",
      description: log.description || "",
      created_at: formatDate(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      ...(includeOldValues && {
        oldValues: log.oldValues ? JSON.stringify(log.oldValues) : "",
      }),
      ...(includeNewValues && {
        newValues: log.newValues ? JSON.stringify(log.newValues) : "",
      }),
      ...(includeMetadata && {
        metadata: log.metadata ? JSON.stringify(log.metadata) : "",
      }),
    }));

    // Write CSV
    await csvWriter.writeRecords(records);

    // Read file as buffer
    const buffer = await fs.readFile(tempFile);

    // Clean up temp file
    await fs.unlink(tempFile).catch((err) => {
      this.logger.warn(`Failed to delete temp file ${tempFile}:`, err);
    });

    this.logger.log(`Exported ${logs.length} audit logs to CSV`);

    return buffer;
  }

  /**
   * Export audit logs to JSON format
   */
  async exportToJson(
    logs: AuditResponseDto[],
    options: {
      includeOldValues?: boolean;
      includeNewValues?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<Buffer> {
    const { includeOldValues = true, includeNewValues = true, includeMetadata = false } = options;

    // Transform logs
    const data = logs.map((log) => {
      const record: ExportRecord = {
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
        created_at: log.created_at,
        changedFields: log.changedFields,
      };

      if (includeOldValues) {
        record.oldValues = log.oldValues;
      }

      if (includeNewValues) {
        record.newValues = log.newValues;
      }

      if (includeMetadata) {
        record.metadata = log.metadata;
      }

      return record;
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      data,
    };

    const json = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(json, "utf-8");

    this.logger.log(`Exported ${logs.length} audit logs to JSON`);

    return buffer;
  }

  /**
   * Export audit logs in the specified format
   */
  async export(
    logs: AuditResponseDto[],
    format: ExportFormat,
    options: {
      includeOldValues?: boolean;
      includeNewValues?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format) {
      case ExportFormat.CSV:
        buffer = await this.exportToCsv(logs, options);
        contentType = "text/csv";
        extension = "csv";
        break;

      case ExportFormat.JSON:
        buffer = await this.exportToJson(logs, options);
        contentType = "application/json";
        extension = "json";
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const timestamp = formatDate(new Date(), "yyyy-MM-dd-HHmmss");
    const filename = `audit-logs-${timestamp}.${extension}`;

    return {
      buffer,
      contentType,
      filename,
    };
  }
}
