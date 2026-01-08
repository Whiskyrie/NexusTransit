import { useState } from "react";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import type { Delivery } from "../../types/delivery.types";
import { DeliveryDetailsModal } from "../deliveries/DeliveryDetailsModal";

interface ShipmentsOverviewProps {
  deliveries: Delivery[];
  isLoading?: boolean;
}

// Configuração de cores baseada no JSON
const statusConfig = {
  DELIVERED: {
    bg: "#ECFDF5",
    text: "#065F46",
    label: "Entregue",
    icon: CheckCircle,
  },
  IN_TRANSIT: {
    bg: "#F5F5F0",
    text: "#1A1A1A",
    label: "Em trânsito",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    bg: "#FEF3C7",
    text: "#92400E",
    label: "Saiu para entrega",
    icon: Package,
  },
  PICKED_UP: {
    bg: "#FEF3C7",
    text: "#92400E",
    label: "Coletado",
    icon: Package,
  },
  PENDING: {
    bg: "#F3F4F6",
    text: "#374151",
    label: "Processando",
    icon: Clock,
  },
  ASSIGNED: {
    bg: "#F3F4F6",
    text: "#374151",
    label: "Atribuído",
    icon: Package,
  },
} as const;

export const ShipmentsOverview = memo(function ShipmentsOverview({
  deliveries,
  isLoading = false,
}: ShipmentsOverviewProps) {
  const navigate = useNavigate();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Pegar as 5 primeiras entregas
  const recentDeliveries = deliveries.slice(0, 5);

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E5E7EB]"
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1A1F2E",
              }}
            >
              Entregas Recentes
            </h3>
            <p
              className="text-xs"
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "#6B7280",
              }}
            >
              {recentDeliveries.length} entregas ativas
            </p>
          </div>

          <button
            onClick={() => navigate("/deliveries")}
            className="px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Ver todas
          </button>
        </div>

        {/* Lista de entregas */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-xl animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : recentDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p
              className="text-sm"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A1F2E",
              }}
            >
              Nenhuma entrega encontrada
            </p>
            <p
              className="text-xs mt-1"
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "#6B7280",
              }}
            >
              Comece criando uma nova entrega
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDeliveries.map((delivery) => {
              const config = getStatusConfig(delivery.status);
              const StatusIcon = config.icon;

              return (
                <div
                  key={delivery.id}
                  className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  {/* Avatar/Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: "#F5F5F0",
                      padding: "8px",
                    }}
                  >
                    <StatusIcon className="w-5 h-5" style={{ color: config.text }} />
                  </div>

                  {/* Informações principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1A1F2E",
                        }}
                      >
                        {delivery.tracking_code}
                      </p>
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#6B7280",
                      }}
                    >
                      {delivery.customer?.name || "Cliente não informado"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    style={{
                      background: config.bg,
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <StatusIcon className="w-3 h-3" style={{ color: config.text }} />
                    <span style={{ color: config.text }}>{config.label}</span>
                  </div>

                  {/* Data */}
                  <div className="text-right min-w-15">
                    <p
                      className="text-xs font-medium"
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#6B7280",
                      }}
                    >
                      {formatDate(delivery.created_at)}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#9CA3AF",
                      }}
                    >
                      {formatTime(delivery.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeliveryDetailsModal
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        delivery={selectedDelivery}
      />
    </>
  );
});
