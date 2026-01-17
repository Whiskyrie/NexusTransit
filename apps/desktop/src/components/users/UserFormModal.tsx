import { useState, useEffect, useMemo } from "react";
import { X, User, Mail, Phone, Lock } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";
import { userService } from "../../services/user.service";
import type { User as UserType, CreateUserDto, UpdateUserDto } from "../../types/user.types";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserType;
}

export function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_type: "driver" as UserType["user_type"],
    status: "active" as UserType["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: "",
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || "",
        user_type: user.user_type,
        status: user.status,
      });
    } else {
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        user_type: "driver",
        status: "active",
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!user && !formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!formData.first_name) {
      newErrors.first_name = "Nome é obrigatório";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Sobrenome é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (user) {
        const updateData: UpdateUserDto = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          user_type: formData.user_type,
          status: formData.status,
        };

        await userService.update(user.id, updateData);
      } else {
        const createData: CreateUserDto = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          user_type: formData.user_type,
          status: formData.status,
        };

        await userService.create(createData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Options para os Select components
  const userTypeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "admin", label: "Administrador" },
      { value: "driver", label: "Motorista" },
      { value: "customer", label: "Cliente" },
      { value: "operator", label: "Operador" },
      { value: "manager", label: "Gerente" },
    ],
    [],
  );

  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Inativo" },
      { value: "suspended", label: "Suspenso" },
    ],
    [],
  );

  if (!isOpen) return null;

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
              <User className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {user ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <p className="text-xs text-gray-500">Preencha os dados do usuário</p>
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
          {/* Row 1: Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome *</label>
              <Input
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Ex: João"
                icon={<User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.first_name}
                className="h-10! text-sm!"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Sobrenome *</label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Ex: Silva"
                icon={<User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.last_name}
                className="h-10! text-sm!"
              />
            </div>
          </div>

          {/* Row 2: E-mail e Telefone */}
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
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Telefone</label>
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

          {/* Row 3: Senha (apenas para novo usuário) */}
          {!user && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Senha *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                icon={<Lock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />}
                error={errors.password}
                className="h-10! text-sm!"
              />
            </div>
          )}

          {/* Row 4: Tipo de Usuário e Status */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Usuário *"
              options={userTypeOptions}
              value={formData.user_type}
              onChange={(value) => handleInputChange("user_type", value)}
              compact
              position="top"
            />
            <Select
              label="Status *"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => handleInputChange("status", value)}
              compact
              position="top"
            />
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
              ) : user ? (
                "Atualizar"
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
