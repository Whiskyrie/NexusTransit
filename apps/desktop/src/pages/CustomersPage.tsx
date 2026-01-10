import { useState } from "react";
import { Plus, RefreshCw, Edit2, Eye, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Table, type TableColumn } from "../components/ui/Table";
import { CustomerModal } from "../components/customers/CustomerModal";
import { CustomerDetailsModal } from "../components/customers/CustomerDetailsModal";
import { CustomerFilters } from "../components/customers/CustomerFilters";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import { customerService } from "../services/customer.service";
import { deliveryService } from "../services/delivery.service";
import type {
  Customer,
  CustomerFilters as CustomerFiltersType,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types/customer.types";

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CustomerFiltersType>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "DESC",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Buscar clientes
  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    refetch,
  } = useQuery({
    queryKey: ["customers", filters],
    queryFn: () => customerService.list(filters),
  });

  // Buscar entregas do cliente selecionado
  const { data: customerDeliveries } = useQuery({
    queryKey: ["deliveries", "customer", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const response = await deliveryService.list({ customer_id: selectedCustomer.id, limit: 10 });
      return response.data;
    },
    enabled: !!selectedCustomer?.id && isDetailsModalOpen,
  });

  // Criar cliente
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDto) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsCreateModalOpen(false);
    },
  });

  // Atualizar cliente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto }) =>
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    },
  });

  // Deletar cliente
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    },
  });

  const handleCreateCustomer = async (data: CreateCustomerDto | UpdateCustomerDto) => {
    await createMutation.mutateAsync(data as CreateCustomerDto);
  };

  const handleUpdateCustomer = async (data: UpdateCustomerDto) => {
    if (!selectedCustomer?.id) return;
    await updateMutation.mutateAsync({ id: selectedCustomer.id, data });
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete?.id) return;
    await deleteMutation.mutateAsync(customerToDelete.id);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleFiltersChange = (newFilters: CustomerFiltersType) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: "DESC",
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const hasActiveFilters = !!(filters.search || filters.status || filters.type || filters.category);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      header: "Cliente",
      width: "25%",
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
            {customer.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A] text-sm">{customer.name}</div>
            <div className="text-xs text-gray-500">{customer.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      width: "12%",
      render: (customer) => (
        <span className="text-sm font-medium text-gray-700">{formatPhone(customer.phone)}</span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      width: "12%",
      render: (customer) => (
        <span className="text-sm font-medium text-gray-700 capitalize">
          {customer.type === "corporate" ? "Pessoa Jurídica" : "Pessoa Física"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      render: (customer) => (
        <span className="text-sm font-medium capitalize text-gray-700">{customer.status}</span>
      ),
    },
    {
      key: "category",
      header: "Categoria",
      width: "12%",
      render: (customer) => (
        <span className="text-sm font-medium capitalize text-gray-700">{customer.category}</span>
      ),
    },
    {
      key: "created_at",
      header: "Cadastro",
      width: "12%",
      render: (customer) => (
        <span className="text-sm text-gray-700">{formatDate(customer.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "8%",
      render: (customer) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleViewDetails(customer)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleEdit(customer)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="Editar cliente"
          >
            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleDelete(customer)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="Excluir cliente"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="max-w-full mx-auto space-y-4 px-4">
        {/* Header Compacto */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">Clientes</h1>
              <p className="text-xs text-gray-500">Gerencie seus clientes e suas informações</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3" onClick={() => refetch()}>
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingCustomers ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Novo Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <CustomerFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            data={customersData?.data || []}
            keyExtractor={(customer) => customer.id}
            isLoading={isLoadingCustomers}
            pagination={
              customersData
                ? {
                    page: customersData.meta.page,
                    limit: customersData.meta.limit,
                    total: customersData.meta.total,
                    total_pages: customersData.meta.total_pages,
                    has_previous: customersData.meta.has_previous,
                    has_next: customersData.meta.has_next,
                    onPageChange: handlePageChange,
                  }
                : undefined
            }
            emptyMessage="Nenhum cliente encontrado"
          />
        </div>
      </div>

      {/* Create Modal */}
      <CustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCustomer}
        isLoading={createMutation.isPending}
      />

      {/* Edit Modal */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={handleUpdateCustomer}
        customer={selectedCustomer || undefined}
        isLoading={updateMutation.isPending}
      />

      {/* Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          deliveries={customerDeliveries}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Excluir Cliente"
        itemName={customerToDelete?.name}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDeleteCustomer}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
      />
    </div>
  );
}
