import { MoreHorizontal, Building2 } from "lucide-react";
import { memo } from "react";
import { tokens } from "@/styles/tokens";

interface TopClientesProps {
  data?: Array<{
    id: string;
    nome: string;
    categoria: string;
    entregas: number;
  }>;
  isLoading?: boolean;
}

export const TopClientes = memo(function TopClientes({
  data,
  isLoading = false,
}: TopClientesProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: tokens.colors.background.card,
        border: `1px solid ${tokens.colors.border.default}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-base font-semibold"
          style={{
            color: tokens.colors.text.primary,
          }}
        >
          Top Clientes
        </h3>
        <button
          className="p-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = tokens.colors.background.hover)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: tokens.colors.text.secondary }} />
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-0">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <div className="h-4 bg-gray-200 rounded w-8" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            </div>
          ))
        ) : data && data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              {/* Left Section */}
              <div className="flex items-center gap-3">
                {/* Avatar/Logo */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: tokens.colors.metric.secondary.bg,
                    padding: "8px",
                    borderRadius: "10px",
                  }}
                >
                  <Building2
                    className="w-5 h-5"
                    style={{ color: tokens.colors.metric.secondary.text }}
                  />
                </div>

                {/* Text Group */}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {item.nome}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    {item.categoria}
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex flex-col items-end">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: tokens.colors.text.primary,
                  }}
                >
                  {item.entregas}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: tokens.colors.text.secondary,
                  }}
                >
                  entregas
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p style={{ fontSize: "14px", color: tokens.colors.text.secondary }}>
              Nenhum dado disponível
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
