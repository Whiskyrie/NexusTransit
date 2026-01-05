import { useState, useEffect } from "react";
import { CreateRouteDto, RouteType } from "../../types/route.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DatePicker } from "../ui/DatePicker";
import { X, MapPin, User, Truck, Clock, Route, FileText, Loader2 } from "lucide-react";
import { driverService } from "../../services/driver.service";
import { vehicleService } from "../../services/vehicle.service";
import type { Driver } from "../../types/driver.types";
import type { Vehicle } from "../../types/vehicle.types";
import { format } from "date-fns";

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRouteDto) => void;
  isLoading?: boolean;
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
    planned_end_time: "18:00",
    estimated_distance_km: 0,
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      // Reset form
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
        planned_end_time: "18:00",
        estimated_distance_km: 0,
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen]);

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
      planned_end_time: formData.planned_end_time || undefined,
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

  const routeTypeLabels: Record<RouteType, string> = {
    [RouteType.URBAN]: "Urbana",
    [RouteType.INTERSTATE]: "Interestadual",
    [RouteType.RURAL]: "Rural",
    [RouteType.EXPRESS]: "Expressa",
    [RouteType.LOCAL]: "Local",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Nova Rota</h2>
              <p className="text-xs text-gray-500">Código: {formData.route_code}</p>
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
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(routeTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Motorista e Veículo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Motorista *</label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <select
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={handleChange}
                  disabled={isLoadingDrivers}
                  className={`w-full h-10 pl-9 pr-3 text-sm border rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.driver_id ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {isLoadingDrivers ? "Carregando..." : "Selecione o motorista"}
                  </option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}
                </select>
                {isLoadingDrivers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Veículo *</label>
              <div className="relative">
                <Truck
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <select
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={handleChange}
                  disabled={isLoadingVehicles}
                  className={`w-full h-10 pl-9 pr-3 text-sm border rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.vehicle_id ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {isLoadingVehicles ? "Carregando..." : "Selecione o veículo"}
                  </option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
                {isLoadingVehicles && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Endereços */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Origem *</label>
              <Input
                name="origin_address"
                value={formData.origin_address}
                onChange={handleChange}
                placeholder="Av. Paulista, 1000 - São Paulo"
                icon={<MapPin className="w-4 h-4 text-green-500" strokeWidth={1.5} />}
                error={errors.origin_address}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Destino *</label>
              <Input
                name="destination_address"
                value={formData.destination_address}
                onChange={handleChange}
                placeholder="Rua Augusta, 500 - São Paulo"
                icon={<MapPin className="w-4 h-4 text-red-500" strokeWidth={1.5} />}
                error={errors.destination_address}
                className="h-10! text-sm!"
              />
            </div>
          </div>

          {/* Row 4: Data e Horários */}
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Horário Fim</label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="time"
                  name="planned_end_time"
                  value={formData.planned_end_time}
                  onChange={handleChange}
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Distância */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Distância Estimada (km)
            </label>
            <input
              type="number"
              name="estimated_distance_km"
              value={formData.estimated_distance_km || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.1"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
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
              Criar Rota
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
