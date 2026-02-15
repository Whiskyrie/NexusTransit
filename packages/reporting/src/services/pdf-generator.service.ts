import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type {
  PDFGenerationOptions,
  ReportData,
  GeneratedReport,
  PDFTableStyle,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class PdfGeneratorService {
  private readonly defaultOptions: PDFGenerationOptions = {
    pageSize: "A4",
    orientation: "portrait",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  };

  private readonly defaultTableStyle: PDFTableStyle = {
    headerBackgroundColor: "#2c3e50",
    headerTextColor: "#ffffff",
    rowBackgroundColor: "#ffffff",
    alternateRowBackgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
    borderWidth: 0.5,
    fontSize: 10,
    cellPadding: 8,
  };

  /**
   * Gera um relatório em formato PDF
   */
  async generate<T>(
    data: ReportData<T>,
    options: PDFGenerationOptions = {},
  ): Promise<GeneratedReport> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: mergedOptions.pageSize,
      layout: mergedOptions.orientation,
      margins: mergedOptions.margins,
    });

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          filename: this.sanitizeFilename(data.title) + ".pdf",
          mimeType: "application/pdf",
          size: buffer.length,
          generatedAt: new Date(),
        });
      });
      doc.on("error", reject);

      this.renderDocument(doc, data, mergedOptions);
      doc.end();
    });
  }

  /**
   * Renderiza o documento PDF completo
   */
  private renderDocument<T>(
    doc: PDFKit.PDFDocument,
    data: ReportData<T>,
    options: PDFGenerationOptions,
  ): void {
    this.renderHeader(doc, options);
    this.renderTitle(doc, data);
    this.renderDescription(doc, data.description);
    this.renderTable(doc, data);
    this.renderFooter(doc, options);
  }

  /**
   * Renderiza o header do documento
   */
  private renderHeader(doc: PDFKit.PDFDocument, options: PDFGenerationOptions): void {
    if (!options.header) return;

    const headerConfig = options.header;

    if (headerConfig.logo) {
      const x = options.margins?.left || 50;
      const y = 20;
      const width = headerConfig.logoWidth || 100;
      const height = headerConfig.logoHeight || 50;
      doc.image(headerConfig.logo, x, y, { width, height });
    }

    if (headerConfig.title) {
      doc.fontSize(12).font("Helvetica-Bold").text(headerConfig.title, { align: "right" });
    }

    doc.moveDown(2);
  }

  /**
   * Renderiza o título do relatório
   */
  private renderTitle<T>(doc: PDFKit.PDFDocument, data: ReportData<T>): void {
    doc.fontSize(18).font("Helvetica-Bold").text(data.title, { align: "center" });

    if (data.description) {
      doc.moveDown(0.5);
    } else {
      doc.moveDown();
    }
  }

  /**
   * Renderiza a descrição do relatório
   */
  private renderDescription(doc: PDFKit.PDFDocument, description?: string): void {
    if (!description) return;

    doc.fontSize(10).font("Helvetica-Oblique").text(description, { align: "center" }).moveDown();
  }

  /**
   * Renderiza a tabela de dados
   */
  private renderTable<T>(doc: PDFKit.PDFDocument, data: ReportData<T>): void {
    const style = this.defaultTableStyle;
    const { columns, rows } = data;

    if (columns.length === 0 || rows.length === 0) {
      doc.fontSize(12).text("Nenhum dado disponível", { align: "center" });
      return;
    }

    const pageWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
    const columnWidth = pageWidth / columns.length;

    let currentY = doc.y;
    const startX = doc.page.margins.left;

    this.renderTableHeader(doc, columns, startX, currentY, columnWidth, style);
    currentY += 25;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown>;

      if (currentY > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        currentY = doc.page.margins.top;
        this.renderTableHeader(doc, columns, startX, currentY, columnWidth, style);
        currentY += 25;
      }

      const bgColor = i % 2 === 0 ? style.rowBackgroundColor : style.alternateRowBackgroundColor;
      this.renderTableRow(doc, columns, row, startX, currentY, columnWidth, style, bgColor);
      currentY += 20;
    }
  }

  /**
   * Renderiza o header da tabela
   */
  private renderTableHeader(
    doc: PDFKit.PDFDocument,
    columns: Array<{ header: string; key: string; width?: number }>,
    startX: number,
    y: number,
    columnWidth: number,
    style: PDFTableStyle,
  ): void {
    const cellPadding = style.cellPadding || 8;

    doc
      .fillColor(style.headerBackgroundColor || "#2c3e50")
      .rect(startX, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 25)
      .fill();

    doc
      .fillColor(style.headerTextColor || "#ffffff")
      .fontSize(style.fontSize || 10)
      .font("Helvetica-Bold");

    let currentX = startX;
    for (const column of columns) {
      const width = column.width || columnWidth;
      doc.text(column.header, currentX + cellPadding, y + 6, {
        width: width - cellPadding * 2,
        align: "left",
      });
      currentX += width;
    }
  }

  /**
   * Renderiza uma linha da tabela
   */
  private renderTableRow(
    doc: PDFKit.PDFDocument,
    columns: Array<{ header: string; key: string; width?: number }>,
    row: Record<string, unknown>,
    startX: number,
    y: number,
    columnWidth: number,
    style: PDFTableStyle,
    backgroundColor?: string,
  ): void {
    const cellPadding = style.cellPadding || 8;
    const rowHeight = 20;

    if (backgroundColor) {
      doc
        .fillColor(backgroundColor)
        .rect(startX, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, rowHeight)
        .fill();
    }

    doc
      .fillColor("#000000")
      .fontSize(style.fontSize || 10)
      .font("Helvetica");

    let currentX = startX;
    for (const column of columns) {
      const width = column.width || columnWidth;
      const value = this.formatValue(row[column.key]);

      doc.text(value, currentX + cellPadding, y + 4, {
        width: width - cellPadding * 2,
        align: "left",
      });
      currentX += width;
    }

    doc
      .strokeColor(style.borderColor || "#dee2e6")
      .lineWidth(0.5)
      .moveTo(startX, y + rowHeight)
      .lineTo(doc.page.width - doc.page.margins.right, y + rowHeight)
      .stroke();
  }

  /**
   * Renderiza o footer do documento
   */
  private renderFooter(doc: PDFKit.PDFDocument, options: PDFGenerationOptions): void {
    if (!options.footer?.showPageNumber) return;

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.count; i++) {
      doc.switchToPage(i);

      const footerText = options.footer.customText
        ? `${options.footer.customText} - Página ${i + 1} de ${range.count}`
        : `Página ${i + 1} de ${range.count}`;

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(footerText, doc.page.margins.left, doc.page.height - 30, {
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });
    }
  }

  /**
   * Formata um valor para exibição na tabela
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (value instanceof Date) return value.toLocaleDateString("pt-BR");
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    return String(value);
  }

  /**
   * Sanitiza um nome de arquivo
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }
}
