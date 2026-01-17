import { MoreHorizontal, Building2 } from "lucide-react";
import { memo } from "react";

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
          Top Clientes
        </h3>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5" style={{ color: "#6B7280" }} />
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
                    background: "#F5F5F0",
                    padding: "8px",
                    borderRadius: "10px",
                  }}
                >
                  <Building2 className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                </div>

                {/* Text Group */}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1F2E",
                    }}
                  >
                    {item.nome}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#6B7280",
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
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  {item.entregas}
                </p>
                <p
                  className="text-xs"
                  style={{
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "#6B7280",
                  }}
                >
                  entregas
                </p>
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
