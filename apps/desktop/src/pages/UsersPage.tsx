import { useState, useEffect } from "react";
import { Plus, Download, RefreshCw } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import { userService } from "../services/user.service";
import type { User, UserFilters } from "../types/user.types";
import {
  UserStatusBadge,
  UserTypeBadge,
  UserFilters as UserFiltersComponent,
  UserFormModal,
  UserActions,
} from "../components/users";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: "",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success",
  ) => {
    setToast({ show: true, message, type });
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.list(filters);
      setUsers(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast("Erro ao carregar usuários", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setIsCreateModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await userService.delete(userToDelete.id);
      showToast("Usuário excluído com sucesso!", "success");
      setDeleteModalOpen(false);
      setUserToDelete(undefined);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { message?: string } })?.data?.message ||
            "Erro ao excluir usuário"
          : "Erro ao excluir usuário";
      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    fetchUsers();
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Nome",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A] font-semibold">
            {user.first_name[0]}
            {user.last_name[0]}
          </div>
          <div>
            <div className="font-medium text-[#1A1A1A]">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "user_type",
      header: "Tipo",
      render: (user) => <UserTypeBadge userType={user.user_type} />,
    },
    {
      key: "status",
      header: "Status",
      render: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      key: "created_at",
      header: "Data de Cadastro",
      render: (user) => new Date(user.created_at).toLocaleDateString("pt-BR"),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      render: (user) => (
        <UserActions user={user} onEdit={handleEditUser} onDelete={handleDeleteClick} />
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
              <h1 className="text-xl font-bold text-[#1A1A1A]">Usuários</h1>
              <p className="text-xs text-gray-500">Gerencie os usuários do sistema</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3">
                <Download className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" onClick={fetchUsers} className="h-9 px-3">
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={handleCreateUser} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <UserFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() =>
            setFilters({ page: 1, limit: 10, search: "", status: undefined, user_type: undefined })
          }
        />

        {/* Table */}
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          pagination={{
            ...pagination,
            page: filters.page || 1,
            limit: filters.limit || 10,
            onPageChange: handlePageChange,
          }}
          emptyMessage="Nenhum usuário encontrado"
        />

        {/* Create Modal */}
        <UserFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleModalSuccess}
        />

        {/* Edit Modal */}
        <UserFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleModalSuccess}
          user={selectedUser}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModalOpen}
          title="Excluir Usuário"
          itemName={userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : ""}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setUserToDelete(undefined);
          }}
        />

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </div>
  );
}
