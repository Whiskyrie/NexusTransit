/**
 * DeliveriesMapTab Component
 * Tab de visualização de entregas em mapa
 */

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { deliveryService } from "@/services/delivery.service";
import type { Delivery } from "@/types/delivery.types";

export function DeliveriesMapTab() {
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveDeliveries = async () => {
    try {
      setIsLoading(true);
      // Buscar apenas entregas em trânsito ou pendentes
      const response = await deliveryService.list({
        page: 1,
        limit: 100,
        active_only: true,
      });
      setActiveDeliveries(response.data);
    } catch (error) {
      console.error("Failed to fetch active deliveries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Carregando entregas ativas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Entregas Ativas</h3>
            <p className="text-sm text-gray-600">
              {activeDeliveries.length} entrega(s) em trânsito ou aguardando
            </p>
          </div>
        </div>

        {/* Lista de entregas ativas */}
        <div className="space-y-3">
          {activeDeliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma entrega ativa no momento</div>
          ) : (
            activeDeliveries.slice(0, 5).map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="font-medium text-gray-900">{delivery.tracking_code}</div>
                    <div className="text-sm text-gray-600">
                      {delivery.driver?.full_name || "Sem motorista"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {delivery.delivery_address?.city || "-"}
                  </div>
                  <div className="text-xs text-gray-500">{delivery.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Placeholder do Mapa */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-150 bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Mapa em Desenvolvimento</h3>
            <p className="text-gray-500 max-w-md">
              A integração com mapas interativos será implementada em breve.
              <br />
              Será possível visualizar entregas em tempo real, rotas e localizações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
