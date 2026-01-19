import type { ReactNode } from "react";

/**
 * Definição de coluna da tabela
 */
export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
}

/**
 * Informações de paginação
 */
export interface TablePagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Props do componente Table
 */
export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  pagination?: TablePagination;
  emptyMessage?: string;
  className?: string;
}
