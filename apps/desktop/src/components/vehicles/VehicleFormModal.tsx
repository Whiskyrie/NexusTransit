import { useState, useEffect, useMemo } from "react";
import {
  CreateVehicleDto,
  VehicleType,
  VehicleStatus,
  FuelType,
  Vehicle,
} from "../../types/vehicle.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select, type SelectOption } from "../ui/Select";
import { X, Truck, Hash, Calendar, Palette, Loader2 } from "lucide-react";

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVehicleDto) => void;
  isLoading?: boolean;
  vehicle?: Vehicle | null;
}

const vehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.MOTORCYCLE]: "Moto",
  [VehicleType.CAR]: "Carro",
  [VehicleType.VAN]: "Van",
  [VehicleType.TRUCK]: "Caminhão",
  [VehicleType.BICYCLE]: "Bicicleta",
};

const fuelTypeLabels: Record<FuelType, string> = {
  [FuelType.GASOLINE]: "Gasolina",
  [FuelType.ETHANOL]: "Etanol",
  [FuelType.DIESEL]: "Diesel",
  [FuelType.FLEX]: "Flex",
  [FuelType.ELECTRIC]: "Elétrico",
  [FuelType.HYBRID]: "Híbrido",
};

export function VehicleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  vehicle,
}: VehicleFormModalProps) {
  const [formData, setFormData] = useState<CreateVehicleDto>({
    license_plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vehicle_type: VehicleType.CAR,
    fuel_type: FuelType.FLEX,
    status: VehicleStatus.ACTIVE,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        // Populate form with vehicle data for editing
        setFormData({
          license_plate: vehicle.license_plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          vehicle_type: vehicle.vehicle_type,
          fuel_type: vehicle.fuel_type,
          status: vehicle.status,
        });
      } else {
        // Reset form for new vehicle
        setFormData({
          license_plate: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          color: "",
          vehicle_type: VehicleType.CAR,
          fuel_type: FuelType.FLEX,
          status: VehicleStatus.ACTIVE,
        });
      }
      setErrors({});
    }
  }, [isOpen, vehicle]);

  // Options para os Select components
  const vehicleTypeSelectOptions: SelectOption<string>[] = useMemo(
    () =>
      Object.entries(vehicleTypeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const fuelTypeSelectOptions: SelectOption<string>[] = useMemo(
    () =>
      Object.entries(fuelTypeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.license_plate || formData.license_plate.length < 7) {
      newErrors.license_plate = "Placa inválida";
    }
    if (!formData.brand || formData.brand.length < 2) {
      newErrors.brand = "Marca deve ter pelo menos 2 caracteres";
    }
    if (!formData.model || formData.model.length < 2) {
      newErrors.model = "Modelo deve ter pelo menos 2 caracteres";
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = "Ano inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? parseInt(value) || 0 : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-3xl w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {vehicle ? "Editar Veículo" : "Novo Veículo"}
              </h2>
              <p className="text-xs text-gray-500">
                {vehicle
                  ? "Atualize as informações do veículo"
                  : "Adicione um novo veículo à frota"}
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
          {/* Row 1: Placa e Marca */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Placa *</label>
              <Input
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="ABC-1D23 ou ABC1234"
                icon={<Hash className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.license_plate}
                className="h-10! text-sm! uppercase"
                maxLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Marca *</label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ex: Toyota, Volkswagen"
                error={errors.brand}
                className="h-10! text-sm!"
              />
            </div>
          </div>

          {/* Row 2: Modelo e Ano */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Modelo *</label>
              <Input
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Ex: Corolla, Gol"
                error={errors.model}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Ano *</label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full h-10 pl-9 pr-3 text-sm border rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.year ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.year && <p className="text-xs text-red-500 mt-1.5">{errors.year}</p>}
            </div>
          </div>

          {/* Row 3: Tipo e Cor */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Veículo *"
              options={vehicleTypeSelectOptions}
              value={formData.vehicle_type}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, vehicle_type: value as VehicleType }))
              }
              compact
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Cor</label>
              <Input
                name="color"
                value={formData.color || ""}
                onChange={handleChange}
                placeholder="Ex: Branco, Preto"
                icon={<Palette className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                className="h-10! text-sm!"
              />
            </div>
          </div>

          {/* Row 4: Combustível */}
          <Select
            label="Tipo de Combustível *"
            options={fuelTypeSelectOptions}
            value={formData.fuel_type}
            onChange={(value) => setFormData((prev) => ({ ...prev, fuel_type: value as FuelType }))}
            compact
            position="top"
          />

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
            <Button type="submit" isLoading={isLoading} className="px-4! py-2! text-sm">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {vehicle ? "Atualizando..." : "Criando..."}
                </>
              ) : vehicle ? (
                "Atualizar Veículo"
              ) : (
                "Criar Veículo"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
