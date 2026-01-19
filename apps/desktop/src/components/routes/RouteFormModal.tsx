import { useState, useEffect, useMemo } from "react";
import { CreateRouteDto, RouteType, Route } from "../../types/route.types";
import { Button } from "@/shared/components/atoms";
import { Input } from "../ui/Input";
import { AddressAutocomplete } from "../ui/AddressAutocomplete";
import { DatePicker } from "../ui/DatePicker";
import { Select, type SelectOption } from "../ui/Select";
import { X, MapPin, Clock, Route as RouteIcon, FileText, Loader2 } from "lucide-react";
import { driverService } from "../../services/driver.service";
import { vehicleService } from "../../services/vehicle.service";
import type { Driver } from "../../types/driver.types";
import type { Vehicle } from "../../types/vehicle.types";
import { format, parse } from "date-fns";

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRouteDto) => void;
  isLoading?: boolean;
  route?: Route | null;
}

// Gera código de rota único
function generateRouteCode(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `RT-${date}-${random}`;
}

export function RouteFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  route,
}: RouteFormModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    route_code: generateRouteCode(),
    name: "",
    description: "",
    driver_id: "",
    vehicle_id: "",
    type: RouteType.URBAN,
    origin_address: "",
    destination_address: "",
    planned_date: format(new Date(), "yyyy-MM-dd"),
    planned_start_time: "08:00",
    estimated_distance_km: 0,
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Coordenadas para cálculo de distância
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Data loading state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch drivers and vehicles
  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchVehicles();

      if (route) {
        try {
          // Populate form with route data for editing
          const routeDate = route.planned_date
            ? parse(route.planned_date, "yyyy-MM-dd", new Date())
            : new Date();

          setSelectedDate(routeDate);
          setFormData({
            route_code: route.route_code || generateRouteCode(),
            name: route.name || "",
            description: route.description || "",
            driver_id: route.driver_id || "",
            vehicle_id: route.vehicle_id || "",
            type: route.type || RouteType.URBAN,
            origin_address: route.origin_address || "",
            destination_address: route.destination_address || "",
            planned_date: route.planned_date || format(new Date(), "yyyy-MM-dd"),
            planned_start_time: route.planned_start_time || "08:00",
            estimated_distance_km: route.estimated_distance_km || 0,
            notes: route.notes || "",
          });
        } catch (error) {
          console.error("Erro ao carregar dados da rota:", error);
          // Fallback para valores padrão em caso de erro
          setSelectedDate(new Date());
          setFormData({
            route_code: generateRouteCode(),
            name: "",
            description: "",
            driver_id: "",
            vehicle_id: "",
            type: RouteType.URBAN,
            origin_address: "",
            destination_address: "",
            planned_date: format(new Date(), "yyyy-MM-dd"),
            planned_start_time: "08:00",
            estimated_distance_km: 0,
            notes: "",
          });
        }
      } else {
        // Reset form for new route
        const now = new Date();
        setSelectedDate(now);
        setFormData({
          route_code: generateRouteCode(),
          name: "",
          description: "",
          driver_id: "",
          vehicle_id: "",
          type: RouteType.URBAN,
          origin_address: "",
          destination_address: "",
          planned_date: format(now, "yyyy-MM-dd"),
          planned_start_time: "08:00",
          estimated_distance_km: 0,
          notes: "",
        });
        setOriginCoords(null);
        setDestinationCoords(null);
      }
      setErrors({});
    }
  }, [isOpen, route]);

  const fetchDrivers = async () => {
    try {
      setIsLoadingDrivers(true);
      const response = await driverService.list({ limit: 100 });
      setDrivers(response.data);
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error);
      setDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const response = await vehicleService.list({ limit: 100 });
      setVehicles(response.data);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Options for Select components - MUST be before early return
  const routeTypeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: RouteType.URBAN, label: "Urbana" },
      { value: RouteType.INTERSTATE, label: "Interestadual" },
      { value: RouteType.RURAL, label: "Rural" },
      { value: RouteType.EXPRESS, label: "Expressa" },
      { value: RouteType.LOCAL, label: "Local" },
    ],
    [],
  );

  const driverOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: isLoadingDrivers ? "Carregando..." : "Selecione o motorista" },
      ...drivers.map((driver) => ({
        value: driver.id,
        label: driver.full_name,
      })),
    ],
    [drivers, isLoadingDrivers],
  );

  const vehicleOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: isLoadingVehicles ? "Carregando..." : "Selecione o veículo" },
      ...vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.license_plate} - ${vehicle.brand} ${vehicle.model}`,
      })),
    ],
    [vehicles, isLoadingVehicles],
  );

  // Função para calcular distância usando fórmula de Haversine
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Atualizar distância quando origem ou destino mudarem
  useEffect(() => {
    if (originCoords && destinationCoords) {
      const distance = calculateDistance(
        originCoords.lat,
        originCoords.lng,
        destinationCoords.lat,
        destinationCoords.lng,
      );
      setFormData((prev) => ({
        ...prev,
        estimated_distance_km: Math.round(distance * 10) / 10, // Arredondar para 1 casa decimal
      }));
    }
  }, [originCoords, destinationCoords]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!formData.driver_id) {
      newErrors.driver_id = "Selecione um motorista";
    }
    if (!formData.vehicle_id) {
      newErrors.vehicle_id = "Selecione um veículo";
    }
    if (!formData.origin_address || formData.origin_address.length < 10) {
      newErrors.origin_address = "Endereço de origem deve ter pelo menos 10 caracteres";
    }
    if (!formData.destination_address || formData.destination_address.length < 10) {
      newErrors.destination_address = "Endereço de destino deve ter pelo menos 10 caracteres";
    }
    if (!formData.planned_date) {
      newErrors.planned_date = "Data é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData: CreateRouteDto = {
      name: formData.name,
      description: formData.description || undefined,
      driver_id: formData.driver_id,
      vehicle_id: formData.vehicle_id,
      type: formData.type,
      planned_date: formData.planned_date,
      planned_start_time: formData.planned_start_time,
      origin_address: formData.origin_address,
      destination_address: formData.destination_address || undefined,
      estimated_distance_km: formData.estimated_distance_km || undefined,
      notes: formData.notes || undefined,
    };

    onSubmit(submitData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({ ...prev, planned_date: format(date, "yyyy-MM-dd") }));
      // Clear error when user selects a date
      if (errors.planned_date) {
        setErrors((prev) => ({ ...prev, planned_date: "" }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <RouteIcon className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {route ? "Editar Rota" : "Nova Rota"}
              </h2>
              <p className="text-xs text-gray-500">
                {route ? "Atualize as informações da rota" : `Código: ${formData.route_code}`}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nome e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Nome da Rota *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Rota Centro-Sul"
                icon={<MapPin className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.name}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo *</label>
              <Select
                options={routeTypeOptions}
                value={formData.type}
                onChange={(value) => setFormData((prev) => ({ ...prev, type: value as RouteType }))}
                placeholder="Selecione o tipo"
                compact
              />
            </div>
          </div>

          {/* Row 2: Motorista e Veículo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Motorista *</label>
              <Select
                options={driverOptions}
                value={formData.driver_id}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, driver_id: value }));
                  if (errors.driver_id) {
                    setErrors((prev) => ({ ...prev, driver_id: "" }));
                  }
                }}
                placeholder="Selecione o motorista"
                error={errors.driver_id}
                disabled={isLoadingDrivers}
                compact
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Veículo *</label>
              <Select
                options={vehicleOptions}
                value={formData.vehicle_id}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, vehicle_id: value }));
                  if (errors.vehicle_id) {
                    setErrors((prev) => ({ ...prev, vehicle_id: "" }));
                  }
                }}
                placeholder="Selecione o veículo"
                error={errors.vehicle_id}
                disabled={isLoadingVehicles}
                compact
              />
            </div>
          </div>

          {/* Row 3: Endereços */}
          <div className="grid grid-cols-2 gap-4">
            <AddressAutocomplete
              label="Origem *"
              name="origin_address"
              value={formData.origin_address}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, origin_address: value }));
                if (errors.origin_address) {
                  setErrors((prev) => ({ ...prev, origin_address: "" }));
                }
              }}
              onSelectAddress={(address) => {
                setOriginCoords({ lat: address.lat, lng: address.lng });
              }}
              placeholder="Digite o endereço de origem..."
              error={errors.origin_address}
            />
            <AddressAutocomplete
              label="Destino *"
              name="destination_address"
              value={formData.destination_address}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, destination_address: value }));
                if (errors.destination_address) {
                  setErrors((prev) => ({ ...prev, destination_address: "" }));
                }
              }}
              onSelectAddress={(address) => {
                setDestinationCoords({ lat: address.lat, lng: address.lng });
              }}
              placeholder="Digite o endereço de destino..."
              error={errors.destination_address}
            />
          </div>

          {/* Row 4: Data e Horário de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                label="Data *"
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Selecione a data"
                minDate={new Date()}
                error={errors.planned_date}
                clearable={false}
                compact
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Horário Início
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="time"
                  name="planned_start_time"
                  value={formData.planned_start_time}
                  onChange={handleChange}
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Distância Estimada (read-only, calculada automaticamente) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Distância Estimada (km)
            </label>
            <input
              type="number"
              name="estimated_distance_km"
              value={formData.estimated_distance_km || ""}
              readOnly
              placeholder="Será calculada automaticamente"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              A distância e duração serão calculadas automaticamente via Google Maps ao selecionar
              origem e destino
            </p>
          </div>

          {/* Row 6: Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Descrição (opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" strokeWidth={1.5} />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Observações sobre a rota..."
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4! py-2! text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="px-4! py-2! text-sm"
              disabled={isLoadingDrivers || isLoadingVehicles}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {route ? "Atualizando..." : "Criando..."}
                </>
              ) : route ? (
                "Atualizar Rota"
              ) : (
                "Criar Rota"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
