import { Injectable } from "@nestjs/common";
import { Parser } from "json2csv";
import { Readable } from "stream";
import type {
  CSVGenerationOptions,
  ReportData,
  GeneratedReport,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class CsvGeneratorService {
  private readonly defaultOptions: CSVGenerationOptions = {
    delimiter: ",",
    includeHeader: true,
    encoding: "utf-8",
    escapeChar: '"',
    quoteChar: '"',
  };

  /**
   * Gera um relatório em formato CSV
   */
  async generate<T>(
    data: ReportData<T>,
    options: CSVGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const fields = data.columns.map((col) => ({
      label: col.header,
      value: col.key,
    }));

    const parser = new Parser({
      fields,
      delimiter: mergedOptions.delimiter,
      quote: mergedOptions.quoteChar,
      escape: mergedOptions.escapeChar,
      header: mergedOptions.includeHeader,
    });

    const csv = parser.parse(data.rows as unknown[]);
    const buffer = this.encodeBuffer(csv, mergedOptions.encoding);

    return {
      buffer,
      filename: this.sanitizeFilename(data.title) + ".csv",
      mimeType: "text/csv",
      size: buffer.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Gera CSV com headers customizados
   */
  async generateWithCustomHeaders<T>(
    data: ReportData<T>,
    headerMapping: Record<string, string>,
    options: CSVGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const fields = data.columns.map((col) => ({
      label: headerMapping[col.key] || col.header,
      value: col.key,
    }));

    const parser = new Parser({
      fields,
      delimiter: mergedOptions.delimiter,
      quote: mergedOptions.quoteChar,
      escape: mergedOptions.escapeChar,
      header: mergedOptions.includeHeader,
    });

    const csv = parser.parse(data.rows as unknown[]);
    const buffer = this.encodeBuffer(csv, mergedOptions.encoding);

    return {
      buffer,
      filename: this.sanitizeFilename(data.title) + ".csv",
      mimeType: "text/csv",
      size: buffer.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Gera CSV com transformação de dados
   */
  async generateWithTransform<T>(
    data: ReportData<T>,
    transform: (row: T) => Record<string, unknown>,
    options: CSVGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const transformedRows = data.rows.map((row) => transform(row));

    const fields = data.columns.map((col) => ({
      label: col.header,
      value: col.key,
    }));

    const parser = new Parser({
      fields,
      delimiter: mergedOptions.delimiter,
      quote: mergedOptions.quoteChar,
      escape: mergedOptions.escapeChar,
      header: mergedOptions.includeHeader,
    });

    const csv = parser.parse(transformedRows);
    const buffer = this.encodeBuffer(csv, mergedOptions.encoding);

    return {
      buffer,
      filename: this.sanitizeFilename(data.title) + ".csv",
      mimeType: "text/csv",
      size: buffer.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Gera CSV em streaming (para grandes volumes)
   */
  async generateStream<T>(
    data: ReportData<T>,
    options: CSVGenerationOptions = {},
  ): Promise<NodeJS.ReadableStream> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const fields = data.columns.map((col) => ({
      label: col.header,
      value: col.key,
    }));

    const parser = new Parser({
      fields,
      delimiter: mergedOptions.delimiter,
      quote: mergedOptions.quoteChar,
      escape: mergedOptions.escapeChar,
      header: mergedOptions.includeHeader,
    });

    const csv = parser.parse(data.rows as unknown[]);
    return Readable.from([csv]);
  }

  /**
   * Codifica o buffer com o encoding especificado
   */
  private encodeBuffer(content: string, encoding?: string): Buffer {
    switch (encoding) {
      case "utf-8-bom":
        return Buffer.from("\uFEFF" + content, "utf-8");
      case "latin1":
        return Buffer.from(content, "latin1");
      case "utf-8":
      default:
        return Buffer.from(content, "utf-8");
    }
  }

  /**
   * Escapa caracteres especiais em um valor CSV
   */
  escapeValue(value: unknown, quoteChar = '"'): string {
    if (value === null || value === undefined) {
      return "";
    }

    let strValue = String(value);

    if (strValue.includes(quoteChar) || strValue.includes(",") || strValue.includes("\n")) {
      strValue = strValue.replace(new RegExp(quoteChar, "g"), quoteChar + quoteChar);
      strValue = quoteChar + strValue + quoteChar;
    }

    return strValue;
  }

  /**
   * Valida se uma string é um CSV válido
   */
  validateCSV(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    if (lines.length === 0) {
      errors.push("CSV vazio");
      return { valid: false, errors };
    }

    const headerCount = lines[0].split(",").length;

    for (let i = 1; i < lines.length; i++) {
      const lineColumns = lines[i].split(",").length;
      if (lineColumns !== headerCount) {
        errors.push(`Linha ${i + 1} tem ${lineColumns} colunas, esperado ${headerCount}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Converte delimitador para o nome amigável
   */
  getDelimiterName(delimiter: string): string {
    const delimiterNames: Record<string, string> = {
      ",": "Vírgula",
      ";": "Ponto e vírgula",
      "\t": "Tab",
      "|": "Pipe",
    };
    return delimiterNames[delimiter] || "Personalizado";
  }

  /**
   * Sanitiza um nome de arquivo
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }
}
