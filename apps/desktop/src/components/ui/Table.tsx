import React from "react";
import { ChevronLeft, ChevronRight, Loader2, PackageOpen } from "lucide-react";

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[#1A1A1A] animate-spin" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Carregando dados...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <PackageOpen className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{emptyMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tente ajustar os filtros ou criar um novo registro
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className={`
                    hover:bg-[#F5F5F0]/50 transition-colors duration-150 group
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                  `}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm align-middle">
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key] || "-")}
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
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Mostrando{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            a{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            de <span className="font-semibold text-[#1A1A1A]">{pagination.total}</span> resultados
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!pagination.has_previous}
              className="
                w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-gray-50 hover:border-gray-300 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10
              "
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={2} />
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
                      <span className="px-1.5 text-gray-400 text-sm">•••</span>
                    )}
                    <button
                      onClick={() => pagination.onPageChange(page)}
                      className={`
                        min-w-9 h-9 px-3 rounded-lg text-sm font-semibold
                        transition-all duration-150
                        focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10
                        ${
                          page === pagination.page
                            ? "bg-[#1A1A1A] text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
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
                w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-gray-50 hover:border-gray-300 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10
              "
            >
              <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
