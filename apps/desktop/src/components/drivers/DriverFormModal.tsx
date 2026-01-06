import { useState, useEffect, useMemo } from "react";
import { X, User, Mail, Phone, CreditCard, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DatePicker } from "../ui/DatePicker";
import { Select, type SelectOption } from "../ui/Select";
import { CreateDriverDto, UpdateDriverDto, CNHCategory, Driver } from "../../types/driver.types";
import { format, parse } from "date-fns";
import { maskCPF, maskPhone, formatCPF, formatPhone } from "../../utils/formatters";

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDriverDto | UpdateDriverDto) => Promise<void>;
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
        cpf: formatCPF(driver.cpf),
        full_name: driver.full_name,
        birth_date: driver.birth_date,
        email: driver.email,
        phone: formatPhone(driver.phone),
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

    // CPF só é obrigatório na criação
    if (!driver) {
      const cpfDigits = formData.cpf.replace(/\D/g, "");
      if (!cpfDigits) {
        newErrors.cpf = "CPF é obrigatório";
      } else if (cpfDigits.length !== 11) {
        newErrors.cpf = "CPF deve ter 11 dígitos";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone = "Telefone deve ter 10 ou 11 dígitos";
    }

    // CNH só é obrigatória na criação
    if (!driver) {
      const cnhDigits = formData.cnh_number.replace(/\D/g, "");
      if (!cnhDigits) {
        newErrors.cnh_number = "CNH é obrigatória";
      } else if (cnhDigits.length !== 11) {
        newErrors.cnh_number = "CNH deve ter 11 dígitos";
      }
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

    if (driver) {
      // Para atualização, enviar apenas os campos que mudaram
      const updateData: UpdateDriverDto = {};

      if (formData.full_name !== driver.full_name) {
        updateData.full_name = formData.full_name;
      }
      if (formData.email !== driver.email) {
        updateData.email = formData.email;
      }
      if (formData.phone.replace(/\D/g, "") !== driver.phone.replace(/\D/g, "")) {
        updateData.phone = formData.phone.replace(/\D/g, "");
      }
      if (formData.birth_date !== driver.birth_date) {
        updateData.birth_date = formData.birth_date;
      }
      if (formData.cnh_category !== driver.cnh_category) {
        updateData.cnh_category = formData.cnh_category;
      }
      if (formData.cnh_expiration_date !== driver.cnh_expiration_date) {
        updateData.cnh_expiration_date = formData.cnh_expiration_date;
      }

      await onSubmit(updateData);
    } else {
      // Para criação, enviar todos os campos
      const createData: CreateDriverDto = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ""),
        phone: formData.phone.replace(/\D/g, ""),
        cnh_number: formData.cnh_number.replace(/\D/g, ""),
      };

      await onSubmit(createData);
    }
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

  // Options para o Select de categoria CNH
  const cnhCategoryOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: CNHCategory.A, label: "A" },
      { value: CNHCategory.B, label: "B" },
      { value: CNHCategory.C, label: "C" },
      { value: CNHCategory.D, label: "D" },
      { value: CNHCategory.E, label: "E" },
      { value: CNHCategory.AB, label: "AB" },
      { value: CNHCategory.AC, label: "AC" },
      { value: CNHCategory.AD, label: "AD" },
      { value: CNHCategory.AE, label: "AE" },
    ],
    [],
  );

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
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                CPF {!driver && "*"}
              </label>
              <Input
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                icon={<CreditCard className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.cpf}
                className="h-10! text-sm!"
                maxLength={14}
                disabled={!!driver}
              />
              {driver && <p className="text-xs text-gray-400 mt-1">CPF não pode ser alterado</p>}
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
                onChange={(e) => handleInputChange("phone", maskPhone(e.target.value))}
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
                Número da CNH {!driver && "*"}
              </label>
              <Input
                value={formData.cnh_number}
                onChange={(e) => handleInputChange("cnh_number", e.target.value)}
                placeholder="00000000000"
                icon={<FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.cnh_number}
                className="h-10! text-sm!"
                maxLength={11}
                disabled={!!driver}
              />
              {driver && <p className="text-xs text-gray-400 mt-1">CNH não pode ser alterada</p>}
            </div>
            <Select
              label="Categoria *"
              options={cnhCategoryOptions}
              value={formData.cnh_category}
              onChange={(value) => handleInputChange("cnh_category", value as CNHCategory)}
              compact
              position="top"
            />
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
