import { useState, useEffect } from "react";
import { X, User, Mail, Phone, CreditCard, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DatePicker } from "../ui/DatePicker";
import { CreateDriverDto, CNHCategory, Driver } from "../../types/driver.types";
import { format, parse } from "date-fns";

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDriverDto) => Promise<void>;
  isLoading?: boolean;
  driver?: Driver | null;
}

export function DriverFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  driver,
}: DriverFormModalProps) {
  const [formData, setFormData] = useState<CreateDriverDto>({
    cpf: "",
    full_name: "",
    birth_date: "",
    email: "",
    phone: "",
    cnh_number: "",
    cnh_category: CNHCategory.B,
    cnh_expiration_date: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateDriverDto, string>>>({});

  useEffect(() => {
    if (driver) {
      setFormData({
        cpf: driver.cpf,
        full_name: driver.full_name,
        birth_date: driver.birth_date,
        email: driver.email,
        phone: driver.phone,
        cnh_number: driver.cnh_number,
        cnh_category: driver.cnh_category,
        cnh_expiration_date: driver.cnh_expiration_date,
      });
    } else {
      setFormData({
        cpf: "",
        full_name: "",
        birth_date: "",
        email: "",
        phone: "",
        cnh_number: "",
        cnh_category: CNHCategory.B,
        cnh_expiration_date: "",
      });
    }
    setErrors({});
  }, [driver, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateDriverDto, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nome completo é obrigatório";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ""))) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    if (!formData.cnh_number.trim()) {
      newErrors.cnh_number = "CNH é obrigatória";
    }

    if (!formData.birth_date) {
      newErrors.birth_date = "Data de nascimento é obrigatória";
    }

    if (!formData.cnh_expiration_date) {
      newErrors.cnh_expiration_date = "Validade da CNH é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreateDriverDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBirthDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      handleInputChange("birth_date", formattedDate);
    }
  };

  const handleCNHExpirationChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      handleInputChange("cnh_expiration_date", formattedDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-3xl w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {driver ? "Editar Motorista" : "Novo Motorista"}
              </h2>
              <p className="text-xs text-gray-500">Preencha os dados do motorista</p>
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
          {/* Row 1: Nome Completo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Nome Completo *
            </label>
            <Input
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Ex: João Silva Santos"
              icon={<User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
              error={errors.full_name}
              className="h-10! text-sm!"
            />
          </div>

          {/* Row 2: CPF e Data de Nascimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">CPF *</label>
              <Input
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value.replace(/\D/g, ""))}
                placeholder="000.000.000-00"
                icon={<CreditCard className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.cpf}
                className="h-10! text-sm!"
                maxLength={14}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Data de Nascimento *
              </label>
              <DatePicker
                value={
                  formData.birth_date
                    ? parse(formData.birth_date, "yyyy-MM-dd", new Date())
                    : undefined
                }
                onChange={handleBirthDateChange}
                error={errors.birth_date}
                compact
              />
            </div>
          </div>

          {/* Row 3: E-mail e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="joao.silva@exemplo.com"
                icon={<Mail className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.email}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Telefone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="(00) 00000-0000"
                icon={<Phone className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.phone}
                className="h-10! text-sm!"
                maxLength={15}
              />
            </div>
          </div>

          {/* Row 4: CNH, Categoria e Validade */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Número da CNH *
              </label>
              <Input
                value={formData.cnh_number}
                onChange={(e) => handleInputChange("cnh_number", e.target.value)}
                placeholder="00000000000"
                icon={<FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.cnh_number}
                className="h-10! text-sm!"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria *</label>
              <select
                value={formData.cnh_category}
                onChange={(e) => handleInputChange("cnh_category", e.target.value as CNHCategory)}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={CNHCategory.A}>A</option>
                <option value={CNHCategory.B}>B</option>
                <option value={CNHCategory.C}>C</option>
                <option value={CNHCategory.D}>D</option>
                <option value={CNHCategory.E}>E</option>
                <option value={CNHCategory.AB}>AB</option>
                <option value={CNHCategory.AC}>AC</option>
                <option value={CNHCategory.AD}>AD</option>
                <option value={CNHCategory.AE}>AE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Validade da CNH *
              </label>
              <DatePicker
                value={
                  formData.cnh_expiration_date
                    ? parse(formData.cnh_expiration_date, "yyyy-MM-dd", new Date())
                    : undefined
                }
                onChange={handleCNHExpirationChange}
                error={errors.cnh_expiration_date}
                compact
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="h-9">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="h-9 min-w-35">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : driver ? (
                "Atualizar"
              ) : (
                "Criar Motorista"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
