import { X, Package, User, MapPin, Calendar, FileText, Truck } from "lucide-react";
import { Button } from "../ui/Button";
import { Delivery } from "../../types/delivery.types";
import { DeliveryStatusBadge, DeliveryPriorityBadge } from "./";

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
}

export function DeliveryDetailsModal({ isOpen, onClose, delivery }: DeliveryDetailsModalProps) {
  if (!isOpen || !delivery) return null;

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address?: Delivery["pickup_address"] | Delivery["delivery_address"]) => {
    if (!address) return "-";
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.postal_code,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Detalhes da Entrega</h2>
              <p className="text-sm text-gray-500">Código: {delivery.tracking_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Status</label>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Prioridade</label>
                <DeliveryPriorityBadge priority={delivery.priority} />
              </div>
            </div>

            {/* Informações do Cliente */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nome:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {delivery.customer?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">E-mail:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {delivery.customer?.email || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {delivery.customer?.phone || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Motorista e Veículo */}
            {(delivery.driver || delivery.vehicle) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Transporte
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {delivery.driver && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Motorista:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {delivery.driver.full_name}
                      </span>
                    </div>
                  )}
                  {delivery.vehicle && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Veículo:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {delivery.vehicle.license_plate} - {delivery.vehicle.model}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Endereço de Coleta */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço de Coleta
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{formatAddress(delivery.pickup_address)}</p>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço de Entrega
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{formatAddress(delivery.delivery_address)}</p>
              </div>
            </div>

            {/* Datas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Datas
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Agendamento:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(delivery.scheduled_delivery_at)}
                  </span>
                </div>
                {delivery.actual_pickup_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Coleta Realizada:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(delivery.actual_pickup_at)}
                    </span>
                  </div>
                )}
                {delivery.actual_delivery_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Entrega Realizada:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(delivery.actual_delivery_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(delivery.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {delivery.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{delivery.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
