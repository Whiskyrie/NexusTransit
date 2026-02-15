/**
 * Interfaces para o módulo de geração de relatórios
 */

/**
 * Opções de formatação para células em relatórios Excel
 */
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  alignment?: "left" | "center" | "right";
  numberFormat?: string;
}

/**
 * Definição de uma coluna em um relatório
 */
export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
  format?: CellFormat;
}

/**
 * Configuração de header/footer para PDF
 */
export interface HeaderFooterConfig {
  title?: string;
  logo?: Buffer;
  logoWidth?: number;
  logoHeight?: number;
  showPageNumber?: boolean;
  showDate?: boolean;
  customText?: string;
}

/**
 * Opções para geração de PDF
 */
export interface PDFGenerationOptions {
  pageSize?: "A4" | "A3" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  title?: string;
  subtitle?: string;
}

/**
 * Opções para geração de Excel
 */
export interface ExcelGenerationOptions {
  sheetName?: string;
  creator?: string;
  createdAt?: Date;
  freezeHeader?: boolean;
  autoFilter?: boolean;
  autoWidth?: boolean;
}

/**
 * Opções para geração de CSV
 */
export interface CSVGenerationOptions {
  delimiter?: "," | ";" | "\t" | "|";
  includeHeader?: boolean;
  encoding?: "utf-8" | "utf-8-bom" | "latin1";
  escapeChar?: string;
  quoteChar?: string;
}

/**
 * Dados de entrada para geração de relatório
 */
export interface ReportData<T = unknown> {
  title: string;
  description?: string;
  columns: ReportColumn[];
  rows: T[];
  metadata?: Record<string, unknown>;
}

/**
 * Filtros para geração de relatório
 */
export interface ReportFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "between";
  value: unknown;
  valueTo?: unknown;
}

/**
 * Configuração de ordenação
 */
export interface ReportSort {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Configuração de agregação
 */
export interface ReportAggregation {
  field: string;
  type: "sum" | "avg" | "count" | "min" | "max";
  alias?: string;
}

/**
 * Opções para construção de relatório
 */
export interface ReportBuilderOptions {
  filters?: ReportFilter[];
  sort?: ReportSort[];
  aggregations?: ReportAggregation[];
  limit?: number;
  offset?: number;
  groupBy?: string[];
}

/**
 * Resultado de um relatório gerado
 */
export interface GeneratedReport {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  generatedAt: Date;
}

/**
 * Tipos de relatório suportados
 */
export enum ReportOutputType {
  PDF = "pdf",
  EXCEL = "excel",
  CSV = "csv",
}

/**
 * Configuração de estilo para tabela em PDF
 */
export interface PDFTableStyle {
  headerBackgroundColor?: string;
  headerTextColor?: string;
  rowBackgroundColor?: string;
  alternateRowBackgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  cellPadding?: number;
}

/**
 * Dados específicos para relatório de entregas
 */
export interface DeliveryReportData {
  deliveryId: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: string;
  scheduledDate: Date;
  actualDate?: Date;
  driverName?: string;
  vehiclePlate?: string;
  weight: number;
  volume: number;
}

/**
 * Dados específicos para relatório de rotas
 */
export interface RouteReportData {
  routeId: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
  stops: number;
  completedStops: number;
  fuelConsumption?: number;
  efficiency: number;
}

/**
 * Dados específicos para relatório de incidentes
 */
export interface IncidentReportData {
  incidentId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: string;
  reportedAt: Date;
  resolvedAt?: Date;
  reportedBy: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  impact?: string;
  resolution?: string;
}
