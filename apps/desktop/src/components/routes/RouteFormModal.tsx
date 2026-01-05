import { useState } from "react";
import { CreateRouteDto, RoutePriority } from "../../types/route.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DateTimePicker } from "../ui/DateTimePicker";
import { X, MapPin } from "lucide-react";

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRouteDto) => void;
  isLoading?: boolean;
}

export function RouteFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RouteFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    priority: RoutePriority.MEDIUM,
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateRouteDto = {
      ...formData,
      start_date: startDate?.toISOString() || "",
      estimated_end_date: endDate?.toISOString() || "",
    };
    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Nova Rota</h2>
            <p className="text-sm text-gray-600 mt-1">Preencha os dados para criar uma nova rota</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Nome da Rota</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Rota Centro - Zona Sul"
              required
              icon={<MapPin className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Prioridade</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full h-11 px-4 pr-10 text-sm border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none"
            >
              {Object.values(RoutePriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <DateTimePicker
            label="Data e Horário de Início"
            value={startDate}
            onChange={setStartDate}
            placeholder="Selecione data e horário de início"
            minDate={new Date()}
          />

          {/* Estimated End Date */}
          <DateTimePicker
            label="Data e Horário Previsto de Término"
            value={endDate}
            onChange={setEndDate}
            placeholder="Selecione data e horário previsto"
            minDate={startDate || new Date()}
          />

          {/* Footer */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Criar Rota
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
