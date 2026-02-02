import { MoreHorizontal } from "lucide-react";
import { memo } from "react";
import { tokens } from "@/styles/tokens";

interface TopEstadosProps {
  data?: Array<{
    estado: string;
    sigla: string;
    entregas: number;
    percentual: number;
  }>;
  isLoading?: boolean;
}

export const TopEstados = memo(function TopEstados({ data, isLoading = false }: TopEstadosProps) {
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
          Top Estados
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
            <div
              key={i}
              className="flex items-center justify-between py-3 animate-pulse"
              style={{ gap: "12px" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-1.5 bg-gray-200 rounded" style={{ width: "100px" }} />
                <div className="flex items-center gap-3 min-w-20">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-8" />
                </div>
              </div>
            </div>
          ))
        ) : data && data.length > 0 ? (
          data.map((item) => (
            <div
              key={item.sigla}
              className="flex items-center justify-between py-3"
              style={{
                gap: "12px",
              }}
            >
              {/* Left Section */}
              <div className="flex items-center gap-3">
                {/* Avatar/Bandeira */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: tokens.colors.metric.secondary.bg,
                    color: tokens.colors.metric.secondary.text,
                  }}
                >
                  {item.sigla}
                </div>

                {/* Label */}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: tokens.colors.text.primary,
                  }}
                >
                  {item.estado}
                </span>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{
                    width: "100px",
                    backgroundColor: tokens.colors.border.default,
                    borderRadius: "3px",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentual}%`,
                      backgroundColor: tokens.colors.metric.primary.bg,
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 min-w-20">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    {item.entregas} entregas
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {item.percentual}%
                  </span>
                </div>
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
