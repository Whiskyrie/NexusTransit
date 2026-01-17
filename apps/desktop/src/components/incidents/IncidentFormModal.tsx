/**
 * Modal de formulário para criar/editar incidente
 */

import { useEffect, useState } from "react";
import { X, Upload, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { driverService } from "../../services/driver.service";
import { vehicleService } from "../../services/vehicle.service";
import { deliveryService } from "../../services/delivery.service";
import { useAuthStore } from "../../stores/auth.store";
import type {
  Incident,
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentType,
  IncidentSeverity,
} from "../../types/incident.types";
import { IncidentTypeLabels, IncidentSeverityLabels } from "../../types/incident.types";

interface IncidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIncidentDto | UpdateIncidentDto) => Promise<void>;
  incident?: Incident | null;
  isLoading?: boolean;
}

const incidentSchema = z.object({
  incident_type: z.string().min(1, "Tipo é obrigatório"),
  severity: z.string().min(1, "Severidade é obrigatória"),
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  driver_id: z.string().min(1, "Motorista é obrigatório"),
  vehicle_id: z.string().optional(),
  delivery_id: z.string().optional(),
  route_id: z.string().optional(),
  location_address: z.string().optional(),
});

type FormData = z.infer<typeof incidentSchema>;

export function IncidentFormModal({
  isOpen,
  onClose,
  onSubmit,
  incident,
  isLoading = false,
}: IncidentFormModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isEditing = !!incident;
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: incident
      ? {
          incident_type: incident.incident_type,
          severity: incident.severity,
          title: incident.title,
          description: incident.description,
          driver_id: incident.driver_id,
          vehicle_id: incident.vehicle_id || "",
          delivery_id: incident.delivery_id || "",
          route_id: incident.route_id || "",
          location_address: incident.location_address || "",
        }
      : undefined,
  });

  const incidentType = watch("incident_type");
  const severity = watch("severity");
  const driverId = watch("driver_id");
  const vehicleId = watch("vehicle_id");
  const deliveryId = watch("delivery_id");

  // Buscar motoristas ativos
  const { data: driversData } = useQuery({
    queryKey: ["drivers", "all"],
    queryFn: () => driverService.list({ limit: 100 }),
    enabled: isOpen,
  });

  // Buscar veículos ativos
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => vehicleService.list({ limit: 100 }),
    enabled: isOpen,
  });

  // Buscar entregas ativas
  const { data: deliveriesData } = useQuery({
    queryKey: ["deliveries", "active"],
    queryFn: () => deliveryService.list({ active_only: true, limit: 100 }),
    enabled: isOpen,
  });

  const drivers = driversData?.data || [];
  const vehicles = vehiclesData?.data || [];
  const deliveries = deliveriesData?.data || [];

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedFiles([]);
    }
  }, [isOpen, reset]);

  // Resetar formulário quando o incident mudar
  useEffect(() => {
    if (incident && isOpen) {
      reset({
        incident_type: incident.incident_type,
        severity: incident.severity,
        title: incident.title,
        description: incident.description,
        driver_id: incident.driver_id,
        vehicle_id: incident.vehicle_id || "",
        delivery_id: incident.delivery_id || "",
        route_id: incident.route_id || "",
        location_address: incident.location_address || "",
      });
    } else if (!incident && isOpen) {
      reset({
        incident_type: "",
        severity: "",
        title: "",
        description: "",
        driver_id: "",
        vehicle_id: "",
        delivery_id: "",
        route_id: "",
        location_address: "",
      });
    }
  }, [incident, isOpen, reset]);

  const handleFormSubmit = async (data: FormData) => {
    if (!user?.id) {
      console.error("Usuário não autenticado");
      return;
    }

    const incidentData = {
      ...data,
      reported_by_user_id: user.id,
    };

    await onSubmit(incidentData as CreateIncidentDto);
    // TODO: Upload files if selectedFiles.length > 0
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  if (!isOpen) return null;

  const typeOptions = Object.entries(IncidentTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const severityOptions = Object.entries(IncidentSeverityLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] mx-4 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {isEditing ? "Editar Incidente" : "Novo Incidente"}
              </h2>
              <p className="text-xs text-gray-500">Preencha os dados do incidente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Tipo e Severidade */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Incidente"
                options={typeOptions}
                value={incidentType}
                onChange={(val) => setValue("incident_type", val as IncidentType)}
                error={errors.incident_type?.message}
              />
              <Select
                label="Severidade"
                options={severityOptions}
                value={severity}
                onChange={(val) => setValue("severity", val as IncidentSeverity)}
                error={errors.severity?.message}
              />
            </div>

            {/* Título */}
            <Input
              label="Título"
              placeholder="Ex: Acidente na Avenida Paulista"
              {...register("title")}
              error={errors.title?.message}
            />

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
                placeholder="Descreva o incidente em detalhes..."
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Motorista */}
            <Select
              label="Motorista"
              options={drivers.map((driver) => ({
                value: driver.id,
                label: driver.full_name,
              }))}
              value={driverId}
              onChange={(val) => setValue("driver_id", val as string)}
              error={errors.driver_id?.message}
              placeholder="Selecione um motorista"
            />

            {/* Campos opcionais */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Veículo (opcional)"
                options={[
                  { value: "", label: "Nenhum" },
                  ...vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: `${vehicle.license_plate} - ${vehicle.model}`,
                  })),
                ]}
                value={vehicleId || ""}
                onChange={(val) => setValue("vehicle_id", val as string)}
                placeholder="Selecione um veículo"
              />
              <Select
                label="Entrega (opcional)"
                options={[
                  { value: "", label: "Nenhuma" },
                  ...deliveries.map((delivery) => ({
                    value: delivery.id,
                    label: delivery.tracking_code,
                  })),
                ]}
                value={deliveryId || ""}
                onChange={(val) => setValue("delivery_id", val as string)}
                placeholder="Selecione uma entrega"
              />
            </div>

            {/* Endereço */}
            <Input
              label="Endereço (opcional)"
              placeholder="Local do incidente"
              {...register("location_address")}
            />

            {/* Upload de Anexos */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexos (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Clique para fazer upload ou arraste arquivos
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Imagens e PDFs até 5MB cada</span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 text-left">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {selectedFiles.length} arquivo(s) selecionado(s):
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>• {file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{isEditing ? "Salvar Alterações" : "Criar Incidente"}</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
