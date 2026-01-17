import {
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  Star,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "../ui/Button";
import type { Customer } from "../../types/customer.types";
import type { Delivery } from "../../types/delivery.types";

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  deliveries?: Delivery[];
  onEdit?: () => void;
}

export function CustomerDetailsModal({
  isOpen,
  onClose,
  customer,
  deliveries,
  onEdit,
}: CustomerDetailsModalProps) {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "blocked":
        return "bg-red-100 text-red-700";
      case "prospect":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "vip":
        return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case "premium":
        return <Star className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "CANCELLED":
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatTaxId = (taxId: string) => {
    const cleaned = taxId.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return taxId;
  };

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
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
              {customer.type === "corporate" ? (
                <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
              ) : (
                <User className="w-6 h-6 text-white" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{customer.name}</h2>
                {getCategoryIcon(customer.category)}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(customer.status)}`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                {customer.type === "corporate" ? "Pessoa Jurídica" : "Pessoa Física"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
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
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Informações Principais */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  Informações Principais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">CPF/CNPJ</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatTaxId(customer.taxId)}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{customer.email}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">Telefone</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatPhone(customer.phone)}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">Categoria</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(customer.category)}
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {customer.category}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">Cadastro</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Última Atualização
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDate(customer.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endereços */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  Endereços
                </h3>

                {customer.addresses && customer.addresses.length > 0 ? (
                  <div className="space-y-4">
                    {customer.addresses.map((address, index) => (
                      <div
                        key={index}
                        className="relative p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-gray-900">
                                {address.type === "residential" && "Residencial"}
                                {address.type === "commercial" && "Comercial"}
                                {address.type === "billing" && "Cobrança"}
                              </span>
                              {address.isDefault && (
                                <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
                                  Padrão
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 ml-10">
                          <p className="font-semibold text-gray-900">
                            {address.street}, {address.number}
                            {address.complement && ` - ${address.complement}`}
                          </p>
                          <p>
                            {address.neighborhood} - {address.city}/{address.state}
                          </p>
                          <p className="text-xs text-gray-500">CEP: {address.zipCode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Nenhum endereço cadastrado</p>
                  </div>
                )}
              </div>

              {/* Entregas */}
              {deliveries && deliveries.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-500" />
                    Histórico de Entregas
                    <span className="text-sm font-normal text-gray-500">
                      ({deliveries.length} {deliveries.length === 1 ? "entrega" : "entregas"})
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                              <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-gray-900 font-mono">
                                {delivery.tracking_code}
                              </span>
                              {delivery.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {delivery.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getDeliveryStatusIcon(delivery.status)}
                            <span className="text-xs font-medium capitalize text-gray-600">
                              {delivery.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-13 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(delivery.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Side Info (4 cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Contatos Adicionais */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Contatos
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 font-medium">Principal</div>
                      <div className="font-bold text-gray-900">{formatPhone(customer.phone)}</div>
                    </div>
                  </div>

                  {customer.contacts && customer.contacts.length > 0
                    ? customer.contacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm text-gray-600 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              contact.type === "whatsapp"
                                ? "bg-green-50"
                                : contact.type === "email"
                                  ? "bg-blue-50"
                                  : "bg-gray-100"
                            }`}
                          >
                            {contact.type === "email" && (
                              <Mail
                                className={`w-4 h-4 ${
                                  contact.type === "email" ? "text-blue-600" : "text-gray-600"
                                }`}
                              />
                            )}
                            {(contact.type === "phone" || contact.type === "whatsapp") && (
                              <Phone
                                className={`w-4 h-4 ${
                                  contact.type === "whatsapp" ? "text-green-600" : "text-gray-600"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-400 font-medium capitalize">
                                {contact.type}
                              </div>
                              {contact.isDefault && (
                                <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-gray-900 truncate">{contact.value}</div>
                            {contact.label && (
                              <div className="text-xs text-gray-400 truncate">{contact.label}</div>
                            )}
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>

              {/* Metadados */}
              {customer.metadata && Object.keys(customer.metadata).length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Metadados
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(customer.metadata).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                      >
                        <span className="text-xs text-gray-500 font-medium">{key}</span>
                        <span className="text-xs font-bold text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-gray-100 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
          >
            Fechar
          </Button>
          {onEdit && (
            <Button
              onClick={onEdit}
              className="h-11 px-6 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium shadow-lg shadow-gray-200"
            >
              Editar Cliente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
