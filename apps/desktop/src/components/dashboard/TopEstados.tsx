import { MoreHorizontal } from "lucide-react";
import { memo } from "react";

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
      className="bg-white rounded-2xl p-6 border border-[#E5E7EB]"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-base font-semibold"
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1A1F2E",
          }}
        >
          Top Estados
        </h3>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5" style={{ color: "#6B7280" }} />
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
                    background: "#F5F5F0",
                    color: "#1A1A1A",
                  }}
                >
                  {item.sigla}
                </div>

                {/* Label */}
                <span
                  className="text-sm font-medium"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1F2E",
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
                    background: "#E5E7EB",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentual}%`,
                      background: "#1A1A1A",
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 min-w-20">
                  <span
                    className="text-xs"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    {item.entregas} entregas
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1A1A1A",
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
            <p style={{ fontSize: "14px", color: "#6B7280" }}>Nenhum dado disponível</p>
          </div>
        )}
      </div>
    </div>
  );
});
