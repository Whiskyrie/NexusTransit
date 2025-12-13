/**
 * Tipos de relatório disponíveis
 *
 * Define os diferentes tipos de relatórios que podem ser gerados no sistema
 */
export enum ReportType {
  /**
   * Relatório de entregas realizadas
   */
  DELIVERIES = "DELIVERIES",

  /**
   * Relatório de performance de motoristas
   */
  DRIVERS_PERFORMANCE = "DRIVERS_PERFORMANCE",

  /**
   * Relatório de uso de veículos
   */
  VEHICLES_USAGE = "VEHICLES_USAGE",

  /**
   * Relatório de rotas executadas
   */
  ROUTES = "ROUTES",

  /**
   * Relatório de ordens de serviço
   */
  SERVICE_ORDERS = "SERVICE_ORDERS",

  /**
   * Relatório de clientes
   */
  CUSTOMERS = "CUSTOMERS",

  /**
   * Relatório financeiro
   */
  FINANCIAL = "FINANCIAL",

  /**
   * Relatório de incidentes
   */
  INCIDENTS = "INCIDENTS",

  /**
   * Relatório customizado
   */
  CUSTOM = "CUSTOM",
}

/**
 * Status do relatório
 *
 * Representa o estado de processamento do relatório
 */
export enum ReportStatus {
  /**
   * Relatório pendente de geração
   */
  PENDING = "PENDING",

  /**
   * Relatório em processamento
   */
  PROCESSING = "PROCESSING",

  /**
   * Relatório gerado com sucesso
   */
  COMPLETED = "COMPLETED",

  /**
   * Erro na geração do relatório
   */
  FAILED = "FAILED",

  /**
   * Relatório cancelado
   */
  CANCELLED = "CANCELLED",

  /**
   * Relatório expirado (arquivo removido)
   */
  EXPIRED = "EXPIRED",
}

/**
 * Formato de exportação do relatório
 *
 * Define os formatos disponíveis para exportação
 */
export enum ReportFormat {
  /**
   * Formato PDF
   */
  PDF = "PDF",

  /**
   * Formato Excel (XLSX)
   */
  EXCEL = "EXCEL",

  /**
   * Formato CSV
   */
  CSV = "CSV",

  /**
   * Formato JSON
   */
  JSON = "JSON",

  /**
   * Formato HTML
   */
  HTML = "HTML",
}

/**
 * Período de tempo do relatório
 */
export enum ReportPeriod {
  /**
   * Hoje
   */
  TODAY = "TODAY",

  /**
   * Esta semana
   */
  THIS_WEEK = "THIS_WEEK",

  /**
   * Este mês
   */
  THIS_MONTH = "THIS_MONTH",

  /**
   * Últimos 7 dias
   */
  LAST_7_DAYS = "LAST_7_DAYS",

  /**
   * Últimos 30 dias
   */
  LAST_30_DAYS = "LAST_30_DAYS",

  /**
   * Últimos 90 dias
   */
  LAST_90_DAYS = "LAST_90_DAYS",

  /**
   * Período customizado
   */
  CUSTOM = "CUSTOM",
}

/**
 * Valida se o tipo de relatório é válido
 */
export function isValidReportType(type: string): type is ReportType {
  return Object.values(ReportType).includes(type as ReportType);
}

/**
 * Valida se o status do relatório é válido
 */
export function isValidReportStatus(status: string): status is ReportStatus {
  return Object.values(ReportStatus).includes(status as ReportStatus);
}

/**
 * Valida se o formato do relatório é válido
 */
export function isValidReportFormat(format: string): format is ReportFormat {
  return Object.values(ReportFormat).includes(format as ReportFormat);
}

/**
 * Valida se o período do relatório é válido
 */
export function isValidReportPeriod(period: string): period is ReportPeriod {
  return Object.values(ReportPeriod).includes(period as ReportPeriod);
}

/**
 * Retorna todos os tipos de relatório disponíveis
 */
export function getAvailableReportTypes(): ReportType[] {
  return Object.values(ReportType);
}

/**
 * Retorna todos os status disponíveis
 */
export function getAvailableReportStatuses(): ReportStatus[] {
  return Object.values(ReportStatus);
}

/**
 * Retorna todos os formatos disponíveis
 */
export function getAvailableReportFormats(): ReportFormat[] {
  return Object.values(ReportFormat);
}

/**
 * Retorna todos os períodos disponíveis
 */
export function getAvailableReportPeriods(): ReportPeriod[] {
  return Object.values(ReportPeriod);
}

/**
 * Traduz tipo de relatório para português
 */
export function translateReportType(type: ReportType): string {
  const translations: Record<ReportType, string> = {
    [ReportType.DELIVERIES]: "Entregas",
    [ReportType.DRIVERS_PERFORMANCE]: "Performance de Motoristas",
    [ReportType.VEHICLES_USAGE]: "Uso de Veículos",
    [ReportType.ROUTES]: "Rotas",
    [ReportType.SERVICE_ORDERS]: "Ordens de Serviço",
    [ReportType.CUSTOMERS]: "Clientes",
    [ReportType.FINANCIAL]: "Financeiro",
    [ReportType.INCIDENTS]: "Incidentes",
    [ReportType.CUSTOM]: "Customizado",
  };
  return translations[type] || type;
}

/**
 * Traduz status do relatório para português
 */
export function translateReportStatus(status: ReportStatus): string {
  const translations: Record<ReportStatus, string> = {
    [ReportStatus.PENDING]: "Pendente",
    [ReportStatus.PROCESSING]: "Processando",
    [ReportStatus.COMPLETED]: "Concluído",
    [ReportStatus.FAILED]: "Falhou",
    [ReportStatus.CANCELLED]: "Cancelado",
    [ReportStatus.EXPIRED]: "Expirado",
  };
  return translations[status] || status;
}

/**
 * Traduz formato do relatório para português
 */
export function translateReportFormat(format: ReportFormat): string {
  const translations: Record<ReportFormat, string> = {
    [ReportFormat.PDF]: "PDF",
    [ReportFormat.EXCEL]: "Excel",
    [ReportFormat.CSV]: "CSV",
    [ReportFormat.JSON]: "JSON",
    [ReportFormat.HTML]: "HTML",
  };
  return translations[format] || format;
}
