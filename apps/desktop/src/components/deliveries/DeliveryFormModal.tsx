import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from "react";
import { X, Package, MapPin } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DateInput } from "../ui/DateInput";
import { Select, type SelectOption } from "../ui/Select";
import { format } from "date-fns";
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  Delivery,
  DeliveryPriority,
} from "../../types/delivery.types";

interface DeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryDto | UpdateDeliveryDto) => Promise<void>;
  isLoading?: boolean;
  delivery?: Delivery | null;
}

export function DeliveryFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  delivery,
}: DeliveryFormModalProps) {
  const [formData, setFormData] = useState<CreateDeliveryDto>({
    customer_id: "",
    description: "",
    weight: 0,
    declared_value: 0,
    priority: "NORMAL",
    scheduled_delivery_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    pickup_address: {
      street: "",
      number: "",
      city: "",
      state: "",
      postal_code: "",
    },
    delivery_address: {
      street: "",
      number: "",
      city: "",
      state: "",
      postal_code: "",
    },
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const priorityOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "LOW", label: "Baixa" },
      { value: "NORMAL", label: "Normal" },
      { value: "HIGH", label: "Alta" },
      { value: "CRITICAL", label: "Crítica" },
    ],
    [],
  );

  useEffect(() => {
    if (isOpen) {
      if (delivery) {
        setFormData({
          customer_id: delivery.customer_id,
          description: delivery.description,
          weight: delivery.weight,
          declared_value: delivery.declared_value,
          priority: delivery.priority,
          scheduled_delivery_at: delivery.scheduled_delivery_at
            ? format(new Date(delivery.scheduled_delivery_at), "yyyy-MM-dd'T'HH:mm")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          pickup_address: delivery.pickup_address,
          delivery_address: delivery.delivery_address,
          notes: delivery.notes,
        });
      } else {
        setFormData({
          customer_id: "",
          description: "",
          weight: 0,
          declared_value: 0,
          priority: "NORMAL",
          scheduled_delivery_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          pickup_address: {
            street: "",
            number: "",
            city: "",
            state: "",
            postal_code: "",
          },
          delivery_address: {
            street: "",
            number: "",
            city: "",
            state: "",
            postal_code: "",
          },
        });
      }
      setErrors({});
    }
  }, [isOpen, delivery]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.customer_id) newErrors.customer_id = "Cliente é obrigatório";
    if (!formData.description.trim()) newErrors.description = "Descrição é obrigatória";
    if (formData.weight <= 0) newErrors.weight = "Peso deve ser maior que zero";
    if (!formData.pickup_address.street)
      newErrors.pickup_street = "Endereço de coleta é obrigatório";
    if (!formData.delivery_address.street)
      newErrors.delivery_street = "Endereço de entrega é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const parsedValue = name === "weight" || name === "declared_value" ? Number(value || 0) : value;

    if (name.startsWith("pickup_")) {
      const field = name.replace("pickup_", "");
      setFormData((prev) => ({
        ...prev,
        pickup_address: {
          ...prev.pickup_address,
          [field]: parsedValue,
        },
      }));
    } else if (name.startsWith("delivery_")) {
      const field = name.replace("delivery_", "");
      setFormData((prev) => ({
        ...prev,
        delivery_address: {
          ...prev.delivery_address,
          [field]: parsedValue,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {delivery ? "Editar Entrega" : "Nova Entrega"}
              </h2>
              <p className="text-xs text-gray-500">
                {delivery ? `Código: ${delivery.tracking_code}` : "Preencha os dados da entrega"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Cliente e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                ID do Cliente *
              </label>
              <Input
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="Ex: 7d3c..."
                error={errors.customer_id}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Prioridade</label>
              <Select
                options={priorityOptions}
                value={formData.priority || "NORMAL"}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value as DeliveryPriority }))
                }
                placeholder="Selecione a prioridade"
                compact
              />
            </div>
          </div>

          {/* Row 2: Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Descrição *</label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ex: Caixa com documentos"
              error={errors.description}
              className="h-10! text-sm!"
            />
          </div>

          {/* Row 3: Peso, Valor e Agendamento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Peso (kg) *</label>
              <Input
                name="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={handleChange}
                placeholder="0.00"
                error={errors.weight}
                className="h-10! text-sm!"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Valor Declarado (R$)
              </label>
              <Input
                name="declared_value"
                type="number"
                step="0.01"
                value={formData.declared_value}
                onChange={handleChange}
                placeholder="0.00"
                className="h-10! text-sm!"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Agendamento</label>
              <DateInput
                variant="datetime-local"
                name="scheduled_delivery_at"
                value={formData.scheduled_delivery_at || ""}
                onChange={handleChange}
                className="h-10! py-2.5! text-sm!"
              />
            </div>
          </div>

          {/* Endereço de Coleta */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-gray-700">Coleta</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Rua *</label>
                <Input
                  name="pickup_street"
                  value={formData.pickup_address.street}
                  onChange={handleChange}
                  placeholder="Ex: Av. Paulista"
                  error={errors.pickup_street}
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Número</label>
                <Input
                  name="pickup_number"
                  value={formData.pickup_address.number}
                  onChange={handleChange}
                  placeholder="Ex: 1000"
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Cidade *</label>
                <Input
                  name="pickup_city"
                  value={formData.pickup_address.city}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo"
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Estado *</label>
                <Input
                  name="pickup_state"
                  value={formData.pickup_address.state}
                  onChange={handleChange}
                  placeholder="Ex: SP"
                  className="h-10! text-sm! uppercase"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">CEP *</label>
                <Input
                  name="pickup_postal_code"
                  value={formData.pickup_address.postal_code}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="h-10! text-sm!"
                />
              </div>
            </div>
          </div>

          {/* Endereço de Entrega */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-gray-700">Entrega</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Rua *</label>
                <Input
                  name="delivery_street"
                  value={formData.delivery_address.street}
                  onChange={handleChange}
                  placeholder="Ex: Rua Augusta"
                  error={errors.delivery_street}
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Número</label>
                <Input
                  name="delivery_number"
                  value={formData.delivery_address.number}
                  onChange={handleChange}
                  placeholder="Ex: 50"
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Cidade *</label>
                <Input
                  name="delivery_city"
                  value={formData.delivery_address.city}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo"
                  className="h-10! text-sm!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Estado *</label>
                <Input
                  name="delivery_state"
                  value={formData.delivery_address.state}
                  onChange={handleChange}
                  placeholder="Ex: SP"
                  className="h-10! text-sm! uppercase"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">CEP *</label>
                <Input
                  name="delivery_postal_code"
                  value={formData.delivery_address.postal_code}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="h-10! text-sm!"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 text-sm text-[#1A1A1A] bg-white border border-[#E5E7EB] rounded-xl outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[#1A1A1A] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.1)] resize-none"
              placeholder="Adicione observações sobre a entrega..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-9"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="h-9 min-w-40">
              {delivery ? "Atualizar" : "Criar Entrega"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
