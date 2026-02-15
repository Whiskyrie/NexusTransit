import { Injectable } from "@nestjs/common";
import type {
  ReportData,
  ReportColumn,
  ReportBuilderOptions,
  ReportFilter,
  ReportSort,
  ReportAggregation,
} from "../interfaces/reporting.interfaces";

@Injectable()
export class ReportBuilderService {
  /**
   * Constrói um relatório a partir de dados brutos aplicando filtros, ordenação e agregações
   */
  buildReport<T extends Record<string, unknown>>(
    data: T[],
    columns: ReportColumn[],
    options: ReportBuilderOptions = {},
  ): ReportData<T> {
    let processedData = [...data];

    if (options.filters && options.filters.length > 0) {
      processedData = this.applyFilters(processedData, options.filters);
    }

    if (options.groupBy && options.groupBy.length > 0) {
      processedData = this.applyGrouping(processedData, options.groupBy, options.aggregations);
    }

    if (options.sort && options.sort.length > 0) {
      processedData = this.applySorting(processedData, options.sort);
    }

    if (options.offset !== undefined) {
      processedData = processedData.slice(options.offset);
    }

    if (options.limit !== undefined) {
      processedData = processedData.slice(0, options.limit);
    }

    return {
      title: "Relatório",
      columns,
      rows: processedData as T[],
    };
  }

  /**
   * Aplica filtros aos dados
   */
  private applyFilters<T extends Record<string, unknown>>(data: T[], filters: ReportFilter[]): T[] {
    return data.filter((item) => {
      return filters.every((filter) => this.evaluateFilter(item, filter));
    });
  }

  /**
   * Avalia se um item passa no filtro
   */
  private evaluateFilter<T extends Record<string, unknown>>(
    item: T,
    filter: ReportFilter,
  ): boolean {
    const fieldValue = item[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case "eq":
        return fieldValue === filterValue;
      case "ne":
        return fieldValue !== filterValue;
      case "gt":
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          (fieldValue as number) > (filterValue as number)
        );
      case "gte":
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          (fieldValue as number) >= (filterValue as number)
        );
      case "lt":
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          (fieldValue as number) < (filterValue as number)
        );
      case "lte":
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          (fieldValue as number) <= (filterValue as number)
        );
      case "contains":
        if (fieldValue === undefined || fieldValue === null) return false;
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case "in":
        if (Array.isArray(filterValue)) {
          return filterValue.includes(fieldValue);
        }
        return String(fieldValue) === String(filterValue);
      case "between": {
        if (fieldValue === undefined || fieldValue === null) return false;
        const val = fieldValue as number;
        const min = filterValue as number;
        const max = filter.valueTo as number;
        return val >= min && val <= max;
      }
      default:
        return true;
    }
  }

  /**
   * Aplica ordenação aos dados
   */
  private applySorting<T extends Record<string, unknown>>(data: T[], sort: ReportSort[]): T[] {
    return [...data].sort((a, b) => {
      for (const sortConfig of sort) {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];

        let comparison = 0;

        if (aValue === undefined || aValue === null) {
          comparison = bValue === undefined || bValue === null ? 0 : 1;
        } else if (bValue === undefined || bValue === null) {
          comparison = -1;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        if (comparison !== 0) {
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Aplica agrupamento e agregações
   */
  private applyGrouping<T extends Record<string, unknown>>(
    data: T[],
    groupBy: string[],
    aggregations?: ReportAggregation[],
  ): T[] {
    const groups = new Map<string, T[]>();

    for (const item of data) {
      const key = groupBy.map((field) => String(item[field] ?? "null")).join("|");
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    const result: T[] = [];

    for (const [groupKey, items] of groups.entries()) {
      const groupValues = groupKey.split("|");
      const aggregated: Record<string, unknown> = {};

      groupBy.forEach((field, index) => {
        const value = groupValues[index];
        aggregated[field] = value === "null" ? null : this.parseValue(value);
      });

      if (aggregations) {
        for (const agg of aggregations) {
          const values = items
            .map((item) => item[agg.field])
            .filter((v): v is number => typeof v === "number");

          aggregated[agg.alias || `${agg.type}_${agg.field}`] = this.calculateAggregation(
            values,
            agg.type,
          );
        }
      }

      result.push(aggregated as T);
    }

    return result;
  }

  /**
   * Calcula uma agregação
   */
  private calculateAggregation(values: number[], type: string): number {
    if (values.length === 0) return 0;

    switch (type) {
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "count":
        return values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      default:
        return 0;
    }
  }

  /**
   * Parse de valor string para tipo apropriado
   */
  private parseValue(value: string): unknown {
    if (value === "null") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value)) && value !== "") return Number(value);
    return value;
  }

  /**
   * Adiciona coluna de resumo com totais
   */
  addSummaryColumn<T extends Record<string, unknown>>(
    data: ReportData<T>,
    summaryColumn: ReportColumn,
    calculateFn: (row: T) => unknown,
  ): ReportData<T> {
    const updatedRows = data.rows.map((row) => ({
      ...row,
      [summaryColumn.key]: calculateFn(row),
    }));

    return {
      ...data,
      columns: [...data.columns, summaryColumn],
      rows: updatedRows,
    };
  }

  /**
   * Adiciona linha de totais ao relatório
   */
  addTotalRow<T extends Record<string, unknown>>(
    data: ReportData<T>,
    totals: Record<string, unknown>,
  ): ReportData<T> {
    const totalRow = { ...totals, _isTotal: true } as unknown as T;

    return {
      ...data,
      rows: [...data.rows, totalRow],
    };
  }

  /**
   * Cria colunas dinamicamente a partir dos dados
   */
  inferColumnsFromData<T extends Record<string, unknown>>(
    sampleRow: T,
    customHeaders?: Record<string, string>,
  ): ReportColumn[] {
    return Object.keys(sampleRow).map((key) => ({
      key,
      header: customHeaders?.[key] || this.formatHeader(key),
      width: 15,
    }));
  }

  /**
   * Formata um nome de campo para header
   */
  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ");
  }
}
