import { useState } from "react";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import type { Delivery } from "../../types/delivery.types";
import { DeliveryDetailsModal } from "../deliveries/DeliveryDetailsModal";
import { tokens } from "@/styles/tokens";

interface ShipmentsOverviewProps {
  deliveries: Delivery[];
  isLoading?: boolean;
}

// Configuração de cores usando design tokens
const statusConfig = {
  DELIVERED: {
    bg: tokens.colors.status.success.light,
    text: tokens.colors.status.success.dark,
    label: "Entregue",
    icon: CheckCircle,
  },
  IN_TRANSIT: {
    bg: tokens.colors.metric.secondary.bg,
    text: tokens.colors.text.primary,
    label: "Em trânsito",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    bg: tokens.colors.status.warning.light,
    text: tokens.colors.status.warning.dark,
    label: "Saiu para entrega",
    icon: Package,
  },
  PICKED_UP: {
    bg: tokens.colors.status.warning.light,
    text: tokens.colors.status.warning.dark,
    label: "Coletado",
    icon: Package,
  },
  PENDING: {
    bg: tokens.colors.background.tertiary,
    text: tokens.colors.text.secondary,
    label: "Processando",
    icon: Clock,
  },
  ASSIGNED: {
    bg: tokens.colors.background.tertiary,
    text: tokens.colors.text.secondary,
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
        className="rounded-2xl p-6"
        style={{
          backgroundColor: tokens.colors.background.card,
          boxShadow: tokens.shadows.card,
          border: `1px solid ${tokens.colors.border.default}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{
                color: tokens.colors.text.primary,
              }}
            >
              Entregas Recentes
            </h3>
            <p
              className="text-xs"
              style={{
                color: tokens.colors.text.secondary,
              }}
            >
              {recentDeliveries.length} entregas ativas
            </p>
          </div>

          <button
            onClick={() => navigate("/deliveries")}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: tokens.colors.metric.primary.bg,
              color: tokens.colors.metric.primary.text,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
                className="flex items-center gap-4 p-4 rounded-xl animate-pulse"
                style={{ backgroundColor: tokens.colors.background.secondary }}
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
            <Package className="w-12 h-12 mb-3" style={{ color: tokens.colors.text.tertiary }} />
            <p
              className="text-sm font-medium"
              style={{
                color: tokens.colors.text.primary,
              }}
            >
              Nenhuma entrega encontrada
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: tokens.colors.text.secondary,
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
                  className="flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: tokens.colors.background.secondary }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = tokens.colors.background.hover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = tokens.colors.background.secondary)
                  }
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  {/* Avatar/Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: tokens.colors.background.secondary,
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
                          color: tokens.colors.text.primary,
                        }}
                      >
                        {delivery.tracking_code}
                      </p>
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{
                        color: tokens.colors.text.secondary,
                      }}
                    >
                      {delivery.customer?.name || "Cliente não informado"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: config.bg,
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
                        color: tokens.colors.text.secondary,
                      }}
                    >
                      {formatDate(delivery.created_at)}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: tokens.colors.text.tertiary,
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
