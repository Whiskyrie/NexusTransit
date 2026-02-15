import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import type {
  ExcelGenerationOptions,
  ReportData,
  GeneratedReport,
  CellFormat,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class ExcelGeneratorService {
  private readonly defaultOptions: ExcelGenerationOptions = {
    sheetName: "Relatório",
    freezeHeader: true,
    autoFilter: true,
    autoWidth: true,
  };

  /**
   * Gera um relatório em formato Excel
   */
  async generate<T>(
    data: ReportData<T>,
    options: ExcelGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const workbook = new ExcelJS.Workbook();

    workbook.creator = mergedOptions.creator || "NexusTransit";
    workbook.created = mergedOptions.createdAt || new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(mergedOptions.sheetName || "Relatório");

    this.configureWorksheet(worksheet, data, mergedOptions);
    this.addData(worksheet, data);
    this.applyFormatting(worksheet, data);

    const buffer = await workbook.xlsx.writeBuffer();
    const bufferNode = Buffer.from(buffer);

    return {
      buffer: bufferNode,
      filename: this.sanitizeFilename(data.title) + ".xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: bufferNode.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Configura a estrutura da planilha
   */
  private configureWorksheet<T>(
    worksheet: ExcelJS.Worksheet,
    data: ReportData<T>,
    options: ExcelGenerationOptions,
  ): void {
    worksheet.columns = data.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    if (options.freezeHeader) {
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
    }

    if (options.autoFilter) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: data.columns.length },
      };
    }
  }

  /**
   * Adiciona os dados à planilha
   */
  private addData<T>(worksheet: ExcelJS.Worksheet, data: ReportData<T>): void {
    const rows = data.rows.map((row) => {
      const rowData: Record<string, unknown> = {};
      for (const col of data.columns) {
        rowData[col.key] = (row as Record<string, unknown>)[col.key];
      }
      return rowData;
    });

    worksheet.addRows(rows);
  }

  /**
   * Aplica formatação à planilha
   */
  private applyFormatting<T>(worksheet: ExcelJS.Worksheet, data: ReportData<T>): void {
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2C3E50" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "000000" } },
      };
    });

    headerRow.height = 25;

    for (let i = 0; i < data.columns.length; i++) {
      const column = data.columns[i];
      const colNumber = i + 1;

      if (column.format) {
        worksheet.getColumn(colNumber).eachCell((cell, rowNumber) => {
          if (rowNumber > 1) {
            this.applyCellFormat(cell, column.format!);
          }
        });
      }
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 20;
      }
    });
  }

  /**
   * Aplica formatação a uma célula
   */
  private applyCellFormat(cell: ExcelJS.Cell, format: CellFormat): void {
    if (format.bold !== undefined) {
      cell.font = { ...cell.font, bold: format.bold };
    }
    if (format.italic !== undefined) {
      cell.font = { ...cell.font, italic: format.italic };
    }
    if (format.underline !== undefined) {
      cell.font = { ...cell.font, underline: format.underline };
    }
    if (format.fontSize !== undefined) {
      cell.font = { ...cell.font, size: format.fontSize };
    }
    if (format.fontColor !== undefined) {
      cell.font = { ...cell.font, color: { argb: format.fontColor.replace("#", "") } };
    }
    if (format.backgroundColor !== undefined) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: format.backgroundColor.replace("#", "") },
      };
    }
    if (format.alignment !== undefined) {
      cell.alignment = { ...cell.alignment, horizontal: format.alignment };
    }
    if (format.numberFormat !== undefined) {
      cell.numFmt = format.numberFormat;
    }
  }

  /**
   * Gera múltiplas planilhas em um único workbook
   */
  async generateMultiSheet<T>(
    sheets: Array<{ name: string; data: ReportData<T>; options?: ExcelGenerationOptions }>,
    globalOptions: ExcelGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = globalOptions.creator || "NexusTransit";
    workbook.created = globalOptions.createdAt || new Date();
    workbook.modified = new Date();

    for (const sheet of sheets) {
      const mergedOptions = { ...this.defaultOptions, ...globalOptions, ...sheet.options };
      const worksheet = workbook.addWorksheet(sheet.name);

      this.configureWorksheet(worksheet, sheet.data, mergedOptions);
      this.addData(worksheet, sheet.data);
      this.applyFormatting(worksheet, sheet.data);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const bufferNode = Buffer.from(buffer);

    return {
      buffer: bufferNode,
      filename: "relatorio_multiplo.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: bufferNode.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Adiciona fórmulas a uma coluna
   */
  addFormula(
    worksheet: ExcelJS.Worksheet,
    column: number,
    startRow: number,
    endRow: number,
    formula: string,
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      const cell = worksheet.getCell(row, column);
      cell.value = { formula: formula.replace("{row}", row.toString()) } as ExcelJS.CellValue;
    }
  }

  /**
   * Aplica estilos condicionais
   */
  applyConditionalFormatting(
    worksheet: ExcelJS.Worksheet,
    range: string,
    rules: Array<{
      type: "cellIs";
      operator: "equal" | "greaterThan" | "lessThan";
      value: number | string;
      priority?: number;
      style: {
        fill?: { type: "pattern"; pattern: "solid"; fgColor: { argb: string } };
        font?: { color: { argb: string } };
      };
    }>,
  ): void {
    for (const rule of rules) {
      worksheet.addConditionalFormatting({
        ref: range,
        rules: [
          {
            type: rule.type,
            operator: rule.operator,
            value: rule.value,
            priority: rule.priority ?? 1,
            style: rule.style,
          } as ExcelJS.ConditionalFormattingRule,
        ],
      });
    }
  }

  /**
   * Sanitiza um nome de arquivo
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }
}
