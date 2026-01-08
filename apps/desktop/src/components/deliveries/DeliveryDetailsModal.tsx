import { X, Package, User, MapPin, Calendar, FileText, Truck, Phone, Mail, Clock, CheckCircle2, ChevronRight, Share2 } from "lucide-react";
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
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleString("pt-BR"),
    };
  };

  const formatAddress = (address?: Delivery["pickup_address"] | Delivery["delivery_address"]) => {
    if (!address) return "-";
    const street = `${address.street}, ${address.number}`;
    const complement = address.complement ? ` - ${address.complement}` : "";
    const district = address.neighborhood;
    const city = `${address.city}/${address.state}`;
    const zip = address.postal_code;

    return {
      title: street + complement,
      subtitle: `${district}, ${city} - ${zip}`
    };
  };

  // Timeline events based on delivery data
  const timelineEvents = [
    {
      label: "Pedido Criado",
      date: formatDateTime(delivery.created_at),
      completed: true,
      icon: FileText,
    },
    {
      label: "Agendado",
      date: formatDateTime(delivery.scheduled_delivery_at),
      completed: true,
      icon: Calendar,
    },
    {
      label: "Coletado",
      date: formatDateTime(delivery.actual_pickup_at),
      completed: !!delivery.actual_pickup_at,
      icon: Package,
    },
    {
      label: "Em Trânsito",
      date: null, // Could infer from status
      completed: ["IN_TRANSIT", "DELIVERED"].includes(delivery.status),
      icon: Truck,
    },
    {
      label: "Entregue",
      date: formatDateTime(delivery.actual_delivery_at),
      completed: delivery.status === "DELIVERED",
      icon: CheckCircle2,
    },
  ];

  const pickup = formatAddress(delivery.pickup_address);
  const dropoff = formatAddress(delivery.delivery_address);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#F8F9FC] w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Package className="w-6 h-6 text-indigo-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {delivery.tracking_code}
                </h2>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                Criado em {formatDateTime(delivery.created_at)?.full}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-12 gap-8">

            {/* Left Column - Main Info (8 cols) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* Route Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  Rota de Entrega
                </h3>

                <div className="relative pl-4">
                  {/* Connecting Line */}
                  <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-gray-100" />

                  {/* Pickup */}
                  <div className="relative flex gap-6 mb-8 group">
                    <div className="relative z-10 w-6 h-6 rounded-full border-[3px] border-white bg-emerald-500 shadow-md ring-4 ring-emerald-50 mt-1" />
                    <div className="flex-1 p-4 rounded-2xl bg-gray-50 border border-gray-100 group-hover:border-emerald-200 transition-colors">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Coleta</div>
                      <div className="font-semibold text-gray-900 mb-1">{typeof pickup !== 'string' ? pickup.title : pickup}</div>
                      <div className="text-sm text-gray-500">{typeof pickup !== 'string' ? pickup.subtitle : ''}</div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="relative flex gap-6 group">
                    <div className="relative z-10 w-6 h-6 rounded-full border-[3px] border-white bg-indigo-600 shadow-md ring-4 ring-indigo-50 mt-1" />
                    <div className="flex-1 p-4 rounded-2xl bg-gray-50 border border-gray-100 group-hover:border-indigo-200 transition-colors">
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Entrega</div>
                      <div className="font-semibold text-gray-900 mb-1">{typeof dropoff !== 'string' ? dropoff.title : dropoff}</div>
                      <div className="text-sm text-gray-500">{typeof dropoff !== 'string' ? dropoff.subtitle : ''}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Histórico
                </h3>

                <div className="relative flex justify-between items-start px-4">
                  {/* Horizontal Line Background */}
                  <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-100 -z-0" />

                  {timelineEvents.map((event, index) => {
                    const isCompleted = event.completed;
                    const Icon = event.icon;
                    return (
                      <div key={index} className="flex flex-col items-center relative z-10 group">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm border-2 ${isCompleted
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-gray-200 text-gray-300"
                            }`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-1">
                          <div className={`text-sm font-bold ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                            {event.label}
                          </div>
                          {event.date && (
                            <div className="flex flex-col text-xs text-gray-500 font-medium">
                              <span>{event.date.date}</span>
                              <span className="text-gray-400">{event.date.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column - Side Info (4 cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Priority & Metrics */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Prioridade</label>
                  <div className="mt-2">
                    <DeliveryPriorityBadge priority={delivery.priority} />
                  </div>
                </div>
              </div>

              {/* Customer Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Cliente
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-linear-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                    {delivery.customer?.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{delivery.customer?.name || "N/A"}</div>
                    <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      Cliente Ativo
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{delivery.customer?.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{delivery.customer?.phone || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  Transporte
                </h3>

                {delivery.driver ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {delivery.driver.full_name[0]}
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Motorista</div>
                          <div className="text-sm font-bold text-gray-900">{delivery.driver.full_name}</div>
                        </div>
                      </div>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>

                    {delivery.vehicle && (
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 font-medium">Veículo</div>
                            <div className="text-sm font-bold text-gray-900">{delivery.vehicle.model}</div>
                            <div className="text-xs text-gray-500 font-mono">{delivery.vehicle.license_plate}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Nenhum motorista atribuído</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {delivery.notes && (
                <div className="bg-yellow-50/50 rounded-3xl p-6 border border-yellow-100">
                  <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-600" />
                    Observações
                  </h3>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    {delivery.notes}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl border-gray-200 hover:bg-gray-50 font-medium">
            Fechar
          </Button>
          <Button className="h-11 px-6 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium shadow-lg shadow-gray-200">
            Editar Entrega
          </Button>
        </div>

      </div>
    </div>
  );
}
