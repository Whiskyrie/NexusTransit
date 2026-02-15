import { Injectable } from "@nestjs/common";
import type {
  ReportData,
  ReportColumn,
  DeliveryReportData,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class DeliveryReportTemplate {
  /**
   * Nome do template
   */
  readonly name = "delivery";

  /**
   * Título padrão do relatório
   */
  readonly defaultTitle = "Relatório de Entregas";

  /**
   * Colunas padrão para o relatório de entregas
   */
  getColumns(): ReportColumn[] {
    return [
      {
        key: "deliveryId",
        header: "ID da Entrega",
        width: 15,
      },
      {
        key: "trackingNumber",
        header: "Número de Rastreio",
        width: 20,
      },
      {
        key: "origin",
        header: "Origem",
        width: 25,
      },
      {
        key: "destination",
        header: "Destino",
        width: 25,
      },
      {
        key: "status",
        header: "Status",
        width: 15,
      },
      {
        key: "scheduledDate",
        header: "Data Prevista",
        width: 15,
      },
      {
        key: "actualDate",
        header: "Data Real",
        width: 15,
      },
      {
        key: "driverName",
        header: "Motorista",
        width: 20,
      },
      {
        key: "vehiclePlate",
        header: "Placa",
        width: 12,
      },
      {
        key: "weight",
        header: "Peso (kg)",
        width: 12,
      },
      {
        key: "volume",
        header: "Volume (m³)",
        width: 12,
      },
    ];
  }

  /**
   * Cria um relatório de entregas a partir dos dados
   */
  createReport(
    deliveries: DeliveryReportData[],
    title?: string,
    description?: string,
  ): ReportData<DeliveryReportData> {
    return {
      title: title || this.defaultTitle,
      description,
      columns: this.getColumns(),
      rows: deliveries,
    };
  }

  /**
   * Calcula métricas de resumo para entregas
   */
  calculateMetrics(deliveries: DeliveryReportData[]) {
    const total = deliveries.length;
    const completed = deliveries.filter((d) => d.status === "delivered").length;
    const inTransit = deliveries.filter((d) => d.status === "in_transit").length;
    const pending = deliveries.filter((d) => d.status === "pending").length;
    const delayed = deliveries.filter((d) => d.status === "delayed").length;

    const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
    const totalVolume = deliveries.reduce((sum, d) => sum + d.volume, 0);

    const onTimeDeliveries = deliveries.filter((d) => {
      if (!d.actualDate || !d.scheduledDate) return false;
      return new Date(d.actualDate) <= new Date(d.scheduledDate);
    }).length;

    return {
      total,
      completed,
      inTransit,
      pending,
      delayed,
      totalWeight,
      totalVolume,
      onTimeDeliveries,
      onTimeRate: total > 0 ? (onTimeDeliveries / completed) * 100 : 0,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Filtra entregas por status
   */
  filterByStatus(deliveries: DeliveryReportData[], status: string): DeliveryReportData[] {
    return deliveries.filter((d) => d.status === status);
  }

  /**
   * Filtra entregas por período
   */
  filterByDateRange(
    deliveries: DeliveryReportData[],
    startDate: Date,
    endDate: Date,
  ): DeliveryReportData[] {
    return deliveries.filter((d) => {
      const date = d.actualDate || d.scheduledDate;
      if (!date) return false;
      const deliveryDate = new Date(date);
      return deliveryDate >= startDate && deliveryDate <= endDate;
    });
  }

  /**
   * Agrupa entregas por motorista
   */
  groupByDriver(deliveries: DeliveryReportData[]) {
    const groups: Record<string, DeliveryReportData[]> = {};

    for (const delivery of deliveries) {
      const driver = delivery.driverName || "Não atribuído";
      if (!groups[driver]) {
        groups[driver] = [];
      }
      groups[driver].push(delivery);
    }

    return groups;
  }

  /**
   * Agrupa entregas por status
   */
  groupByStatus(deliveries: DeliveryReportData[]) {
    const groups: Record<string, DeliveryReportData[]> = {};

    for (const delivery of deliveries) {
      const status = delivery.status || "unknown";
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(delivery);
    }

    return groups;
  }
}
