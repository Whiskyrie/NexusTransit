import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { userService } from "../services/user.service";
import type { User, UserFilters } from "../types/user.types";

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

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.list(filters);
      setUsers(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
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
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            user.user_type === "admin"
              ? "bg-purple-100 text-purple-800"
              : user.user_type === "driver"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.user_type}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.status}
        </span>
      ),
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
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por nome ou email..."
            icon={<Search className="w-5 h-5" />}
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <Button variant="outline" className="px-4">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
        </Button>
      </div>

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
      />
    </div>
  );
}
