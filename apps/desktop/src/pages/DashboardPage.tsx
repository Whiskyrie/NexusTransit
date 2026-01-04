import {
  Search,
  Download,
  Plus,
  MoreHorizontal,
  MapPin,
  Calendar,
  ArrowUpRight,
  Truck,
  Package,
} from "lucide-react";
import { useUser } from "../stores/auth.store";

// --- Components ---

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "active" | "count";
}) {
  const variants = {
    default: "bg-[#F5F5F0] text-[#1A1A1A]",
    active: "bg-[#000000] text-white",
    count: "bg-[#F5F5F0] text-[#6B6B6B] font-medium text-xs",
  };

  return (
    <span
      className={`px-3 py-1.5 rounded-lg text-[13px] inline-flex items-center justify-center ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    "Picked up": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
    "In transit": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    Delivered: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  };

  const style = styles[status as keyof typeof styles] || styles["Pending"];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit ${style.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className={`text-xs font-medium ${style.text}`}>{status}</span>
    </div>
  );
}

function IconButton({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <button className="w-10 h-10 rounded-[10px] bg-[#F5F5F0] flex items-center justify-center hover:bg-gray-200 transition-colors">
      <Icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
    </button>
  );
}

// --- Mock Data ---

const orders = [
  {
    id: "#89242011",
    assignedTo: "Esther Howard",
    pickup: "2972 Westheimer Rd.",
    delivery: "8502 Preston Rd.",
    date: "18 Dez, 2024",
    status: "Picked up",
  },
  {
    id: "#89242012",
    assignedTo: "Brooklyn Simmons",
    pickup: "4517 Washington Ave.",
    delivery: "3891 Ranchview Dr.",
    date: "19 Dez, 2024",
    status: "In transit",
  },
  {
    id: "#89242013",
    assignedTo: "Robert Fox",
    pickup: "1901 Thornridge Cir.",
    delivery: "4140 Parker Rd.",
    date: "20 Dez, 2024",
    status: "Pending",
  },
  {
    id: "#89242014",
    assignedTo: "Cameron Williamson",
    pickup: "2464 Royal Ln.",
    delivery: "2118 Thornridge Cir.",
    date: "21 Dez, 2024",
    status: "Delivered",
  },
];

const salesData = [
  { region: "China", value: 45, color: "bg-[#1A1A1A]" },
  { region: "UE", value: 25, color: "bg-[#6B7280]" },
  { region: "USA", value: 15, color: "bg-[#9CA3AF]" },
  { region: "Canada", value: 10, color: "bg-[#D1D5DB]" },
  { region: "Outros", value: 5, color: "bg-[#E5E7EB]" },
];

export function DashboardPage() {
  const user = useUser();

  return (
    <div className="space-y-8 font-sans text-[#1A1A1A]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-[#6B6B6B]">Bem-vindo de volta, {user?.first_name || "Usuário"}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-11 pr-4 py-3 bg-white rounded-xl border-none focus:ring-2 focus:ring-black/5 w-64 text-sm placeholder:text-[#9CA3AF]"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-[#000000] text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors shadow-lg shadow-black/10">
            <Plus className="w-4 h-4" />
            Nova Remessa
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Card */}
        <div className="bg-white p-6 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Visão Geral de Vendas</h3>
            <IconButton icon={MoreHorizontal} />
          </div>

          <div className="flex items-end gap-4 mb-8">
            <span className="text-4xl font-bold tracking-tight">R$ 24.500,00</span>
            <div className="flex items-center gap-1 mb-1.5 px-2 py-1 bg-green-50 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>
          </div>

          {/* Simple Bar Chart Visualization */}
          <div className="space-y-4">
            <div className="flex h-4 rounded-full overflow-hidden gap-1">
              {salesData.map((item) => (
                <div
                  key={item.region}
                  className={`h-full ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              {salesData.map((item) => (
                <div key={item.region} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-[#6B6B6B]">{item.region}</span>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fulfillment Performance Card */}
        <div className="bg-[#E8E8E0] p-6 rounded-[20px] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Performance</h3>
              <IconButton icon={MoreHorizontal} />
            </div>
            <div className="space-y-4 mt-8">
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-black text-white rounded-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Entregas no Prazo</span>
                </div>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-black text-white rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Total Processado</span>
                </div>
                <p className="text-2xl font-bold">1,284</p>
              </div>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-lg">Pedidos Recentes</h3>
            <div className="flex gap-2">
              <Badge variant="active">Todos</Badge>
              <Badge>Em Trânsito</Badge>
              <Badge>Pendentes</Badge>
            </div>
          </div>
          <button className="text-sm font-medium text-[#6B6B6B] hover:text-black transition-colors">
            Ver todos
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  ID do Pedido
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Responsável
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Coleta
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Entrega
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Previsão
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-[#1A1A1A]">{order.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {order.assignedTo.charAt(0)}
                      </div>
                      <span className="text-sm text-[#1A1A1A]">{order.assignedTo}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="truncate max-w-37.5">{order.pickup}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="truncate max-w-37.5">{order.delivery}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                      <span>{order.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
