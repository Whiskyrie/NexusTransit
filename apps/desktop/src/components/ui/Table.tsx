import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Definição de coluna da tabela
 */
export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

/**
 * Props do componente Table
 */
interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
}

/**
 * Componente de Tabela Reutilizável
 *
 * Suporta colunas customizáveis, paginação e estados de loading
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  pagination,
  emptyMessage = "Nenhum registro encontrado",
}: TableProps<T>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1A1A1A] rounded-full animate-spin" />
                    <span>Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm">
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && !isLoading && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando{" "}
            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> a{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            de <span className="font-medium">{pagination.total}</span> resultados
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!pagination.has_previous}
              className="
                p-2 rounded-lg border border-gray-300
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-gray-50 transition-colors
              "
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.total_pages ||
                    Math.abs(page - pagination.page) <= 1,
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => pagination.onPageChange(page)}
                      className={`
                        min-w-8 h-8 px-2 rounded-lg text-sm font-medium
                        transition-colors
                        ${
                          page === pagination.page
                            ? "bg-[#1A1A1A] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
              className="
                p-2 rounded-lg border border-gray-300
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-gray-50 transition-colors
              "
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
