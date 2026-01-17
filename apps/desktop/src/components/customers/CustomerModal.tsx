import { useState, useEffect } from "react";
import { X, Plus, Trash2, MapPin, Phone, Mail, User, Building2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select/Select";
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerType,
  CustomerStatus,
  CustomerCategory,
  CustomerAddress,
  CustomerContact,
  AddressType,
  ContactType,
} from "../../types/customer.types";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomerDto | UpdateCustomerDto) => Promise<void>;
  customer?: Customer;
  isLoading?: boolean;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSave,
  customer,
  isLoading,
}: CustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    taxId: "",
    name: "",
    email: "",
    phone: "",
    type: "individual" as CustomerType,
    status: "active" as CustomerStatus,
    category: "standard" as CustomerCategory,
    addresses: [],
    contacts: [],
    preferences: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        taxId: customer.taxId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type,
        status: customer.status,
        category: customer.category,
        addresses: customer.addresses || [],
        contacts: customer.contacts || [],
        preferences: customer.preferences || [],
      });
    } else {
      setFormData({
        taxId: "",
        name: "",
        email: "",
        phone: "",
        type: "individual" as CustomerType,
        status: "active" as CustomerStatus,
        category: "standard" as CustomerCategory,
        addresses: [],
        contacts: [],
        preferences: [],
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.taxId || formData.taxId.length < 11) {
      newErrors.taxId = "CPF/CNPJ inválido";
    }
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...(formData.addresses ?? []),
        {
          street: "",
          number: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          type: "residential" as AddressType,
          isDefault: (formData.addresses || []).length === 0,
        },
      ],
    });
  };

  const removeAddress = (index: number) => {
    const newAddresses = [...(formData.addresses || [])];
    newAddresses.splice(index, 1);
    setFormData({ ...formData, addresses: newAddresses });
  };

  const updateAddress = (index: number, field: keyof CustomerAddress, value: any) => {
    const newAddresses = [...(formData.addresses || [])];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData({ ...formData, addresses: newAddresses });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...(formData.contacts || []),
        {
          type: "phone" as ContactType,
          value: "",
          isDefault: (formData.contacts || []).length === 0,
        },
      ],
    });
  };

  const removeContact = (index: number) => {
    const newContacts = [...(formData.contacts || [])];
    newContacts.splice(index, 1);
    setFormData({ ...formData, contacts: newContacts });
  };

  const updateContact = (index: number, field: keyof CustomerContact, value: any) => {
    const newContacts = [...(formData.contacts || [])];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              {customer ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {customer
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Informações Básicas
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select<CustomerType>
                  label="Tipo de Cliente"
                  options={[
                    { value: CustomerType.INDIVIDUAL, label: "Pessoa Física" },
                    { value: CustomerType.CORPORATE, label: "Pessoa Jurídica" },
                  ]}
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value })}
                  placeholder="Selecione o tipo"
                />

                <Input
                  label="CPF/CNPJ"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value.replace(/\D/g, "") })
                  }
                  error={errors.taxId}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  icon={<Building2 className="w-4 h-4" />}
                />

                <Input
                  label="Nome Completo / Razão Social"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="João Silva"
                  icon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  placeholder="joao.silva@email.com"
                  icon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                  }
                  error={errors.phone}
                  placeholder="(11) 99999-9999"
                  maxLength={11}
                  icon={<Phone className="w-4 h-4" />}
                />

                <Select<CustomerStatus>
                  label="Status"
                  options={[
                    { value: CustomerStatus.ACTIVE, label: "Ativo" },
                    { value: CustomerStatus.INACTIVE, label: "Inativo" },
                    { value: CustomerStatus.BLOCKED, label: "Bloqueado" },
                    { value: CustomerStatus.PROSPECT, label: "Prospect" },
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  placeholder="Selecione o status"
                />

                <Select<CustomerCategory>
                  label="Categoria"
                  options={[
                    { value: CustomerCategory.STANDARD, label: "Standard" },
                    { value: CustomerCategory.PREMIUM, label: "Premium" },
                    { value: CustomerCategory.VIP, label: "VIP" },
                  ]}
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder="Selecione a categoria"
                />
              </div>
            </section>

            {/* Endereços */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Endereços
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAddress}
                  className="text-xs px-3 py-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Endereço
                </Button>
              </div>

              <div className="space-y-4">
                {(formData.addresses || []).map((address, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Endereço {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="CEP"
                        value={address.zipCode}
                        onChange={(e) =>
                          updateAddress(index, "zipCode", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="00000-000"
                        maxLength={8}
                      />

                      <Input
                        label="Rua"
                        value={address.street}
                        onChange={(e) => updateAddress(index, "street", e.target.value)}
                        placeholder="Rua Exemplo"
                        className="md:col-span-2"
                      />

                      <Input
                        label="Número"
                        value={address.number}
                        onChange={(e) => updateAddress(index, "number", e.target.value)}
                        placeholder="123"
                      />

                      <Input
                        label="Complemento"
                        value={address.complement || ""}
                        onChange={(e) => updateAddress(index, "complement", e.target.value)}
                        placeholder="Apto 101"
                      />

                      <Input
                        label="Bairro"
                        value={address.neighborhood}
                        onChange={(e) => updateAddress(index, "neighborhood", e.target.value)}
                        placeholder="Centro"
                      />

                      <Input
                        label="Cidade"
                        value={address.city}
                        onChange={(e) => updateAddress(index, "city", e.target.value)}
                        placeholder="São Paulo"
                      />

                      <Input
                        label="Estado"
                        value={address.state}
                        onChange={(e) => updateAddress(index, "state", e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                      />

                      <Select<AddressType>
                        label="Tipo"
                        options={[
                          { value: AddressType.RESIDENTIAL, label: "Residencial" },
                          { value: AddressType.COMMERCIAL, label: "Comercial" },
                          { value: AddressType.BILLING, label: "Cobrança" },
                        ]}
                        value={address.type}
                        onChange={(value) => updateAddress(index, "type", value)}
                        placeholder="Selecione o tipo"
                      />

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id={`default-address-${index}`}
                          checked={address.isDefault || false}
                          onChange={(e) => updateAddress(index, "isDefault", e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#1A1A1A] focus:ring-[#1A1A1A]"
                        />
                        <label
                          htmlFor={`default-address-${index}`}
                          className="text-sm text-gray-600"
                        >
                          Endereço padrão
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contatos */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Contatos Adicionais
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContact}
                  className="text-xs px-3 py-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Contato
                </Button>
              </div>

              <div className="space-y-3">
                {(formData.contacts || []).map((contact, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select<ContactType>
                        label="Tipo"
                        options={[
                          { value: ContactType.PHONE, label: "Telefone" },
                          { value: ContactType.EMAIL, label: "Email" },
                          { value: ContactType.WHATSAPP, label: "WhatsApp" },
                        ]}
                        value={contact.type}
                        onChange={(value) => updateContact(index, "type", value)}
                        placeholder="Selecione o tipo"
                      />

                      <Input
                        label="Valor"
                        value={contact.value}
                        onChange={(e) => updateContact(index, "value", e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="md:col-span-2"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group mt-6"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="h-11 px-6">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="h-11 px-6">
            {customer ? "Salvar Alterações" : "Cadastrar Cliente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
