import { Injectable } from "@nestjs/common";
import type {
  ReportData,
  ReportColumn,
  IncidentReportData,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class IncidentReportTemplate {
  /**
   * Nome do template
   */
  readonly name = "incident";

  /**
   * Título padrão do relatório
   */
  readonly defaultTitle = "Relatório de Incidentes";

  /**
   * Colunas padrão para o relatório de incidentes
   */
  getColumns(): ReportColumn[] {
    return [
      {
        key: "incidentId",
        header: "ID do Incidente",
        width: 15,
      },
      {
        key: "type",
        header: "Tipo",
        width: 20,
      },
      {
        key: "severity",
        header: "Severidade",
        width: 12,
      },
      {
        key: "description",
        header: "Descrição",
        width: 40,
      },
      {
        key: "location",
        header: "Localização",
        width: 25,
      },
      {
        key: "reportedAt",
        header: "Data de Registro",
        width: 18,
      },
      {
        key: "resolvedAt",
        header: "Data de Resolução",
        width: 18,
      },
      {
        key: "reportedBy",
        header: "Reportado Por",
        width: 20,
      },
      {
        key: "status",
        header: "Status",
        width: 12,
      },
      {
        key: "impact",
        header: "Impacto",
        width: 30,
      },
      {
        key: "resolution",
        header: "Resolução",
        width: 30,
      },
    ];
  }

  /**
   * Cria um relatório de incidentes a partir dos dados
   */
  createReport(
    incidents: IncidentReportData[],
    title?: string,
    description?: string,
  ): ReportData<IncidentReportData> {
    return {
      title: title || this.defaultTitle,
      description,
      columns: this.getColumns(),
      rows: incidents,
    };
  }

  /**
   * Calcula métricas de resumo para incidentes
   */
  calculateMetrics(incidents: IncidentReportData[]) {
    const total = incidents.length;
    const bySeverity = {
      critical: incidents.filter((i) => i.severity === "critical").length,
      high: incidents.filter((i) => i.severity === "high").length,
      medium: incidents.filter((i) => i.severity === "medium").length,
      low: incidents.filter((i) => i.severity === "low").length,
    };

    const byStatus = {
      open: incidents.filter((i) => i.status === "open").length,
      in_progress: incidents.filter((i) => i.status === "in_progress").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
      closed: incidents.filter((i) => i.status === "closed").length,
    };

    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    const avgResolutionTime =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, i) => {
            const reported = new Date(i.reportedAt).getTime();
            const resolved = new Date(i.resolvedAt!).getTime();
            return sum + (resolved - reported);
          }, 0) /
          resolvedIncidents.length /
          (1000 * 60 * 60)
        : 0;

    return {
      total,
      bySeverity,
      byStatus,
      openIncidents: byStatus.open + byStatus.in_progress,
      resolvedIncidents: byStatus.resolved + byStatus.closed,
      avgResolutionTime,
      criticalRate: total > 0 ? (bySeverity.critical / total) * 100 : 0,
      resolutionRate: total > 0 ? ((byStatus.resolved + byStatus.closed) / total) * 100 : 0,
    };
  }

  /**
   * Filtra incidentes por severidade
   */
  filterBySeverity(
    incidents: IncidentReportData[],
    severity: IncidentReportData["severity"],
  ): IncidentReportData[] {
    return incidents.filter((i) => i.severity === severity);
  }

  /**
   * Filtra incidentes por status
   */
  filterByStatus(
    incidents: IncidentReportData[],
    status: IncidentReportData["status"],
  ): IncidentReportData[] {
    return incidents.filter((i) => i.status === status);
  }

  /**
   * Filtra incidentes por período
   */
  filterByDateRange(
    incidents: IncidentReportData[],
    startDate: Date,
    endDate: Date,
  ): IncidentReportData[] {
    return incidents.filter((i) => {
      const reportedDate = new Date(i.reportedAt);
      return reportedDate >= startDate && reportedDate <= endDate;
    });
  }

  /**
   * Agrupa incidentes por tipo
   */
  groupByType(incidents: IncidentReportData[]) {
    const groups: Record<string, IncidentReportData[]> = {};

    for (const incident of incidents) {
      const type = incident.type || "unknown";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(incident);
    }

    return groups;
  }

  /**
   * Identifica incidentes críticos não resolvidos
   */
  getCriticalOpenIncidents(incidents: IncidentReportData[]): IncidentReportData[] {
    return incidents.filter(
      (i) => i.severity === "critical" && (i.status === "open" || i.status === "in_progress"),
    );
  }

  /**
   * Calcula tempo de resolução para um incidente específico
   */
  calculateResolutionTime(incident: IncidentReportData): number | null {
    if (!incident.resolvedAt) return null;

    const reported = new Date(incident.reportedAt).getTime();
    const resolved = new Date(incident.resolvedAt).getTime();
    return (resolved - reported) / (1000 * 60 * 60);
  }

  /**
   * Gera um resumo de texto do incidente
   */
  generateSummary(incident: IncidentReportData): string {
    const resolutionTime = incident.resolvedAt ? this.calculateResolutionTime(incident) : null;

    return [
      `Incidente ${incident.incidentId} - ${incident.type}`,
      `Severidade: ${incident.severity.toUpperCase()}`,
      `Status: ${incident.status}`,
      `Local: ${incident.location}`,
      `Reportado por: ${incident.reportedBy} em ${new Date(incident.reportedAt).toLocaleString("pt-BR")}`,
      resolutionTime ? `Resolvido em ${resolutionTime.toFixed(2)} horas` : "Ainda em aberto",
      incident.resolution ? `Resolução: ${incident.resolution}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
}
