import {
  Search,
  Download,
  Plus,
  MapPin,
  Calendar,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useUser } from "../stores/auth.store";
import { MetricCard } from "../components/ui/MetricCard";
import { LineChart } from "../components/ui/charts/LineChart";
import { BarChart } from "../components/ui/charts/BarChart";

// --- Types ---

interface Order {
  id: string;
  assignedTo: string;
  pickup: string;
  delivery: string;
  date: string;
  status: OrderStatus;
}

type OrderStatus = "Picked up" | "In transit" | "Delivered" | "Pending";

interface WeeklyPerformanceData {
  day: string;
  value: number;
}

interface DeliveryRegionData {
  region: string;
  completed: number;
  pending: number;
}

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

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
    "Picked up": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
    "In transit": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    Delivered: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  };

  const style = styles[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit ${style.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className={`text-xs font-medium ${style.text}`}>{status}</span>
    </div>
  );
}

function IconButton({
  icon: Icon,
  onClick,
  title,
}: {
  icon: React.ElementType;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-10 h-10 rounded-[10px] bg-[#F5F5F0] flex items-center justify-center hover:bg-gray-200 transition-colors"
    >
      <Icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
    </button>
  );
}

// --- Mock Data ---

const orders: Order[] = [
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

const weeklyPerformanceData: WeeklyPerformanceData[] = [
  { day: "Seg", value: 120 },
  { day: "Ter", value: 145 },
  { day: "Qua", value: 132 },
  { day: "Qui", value: 150 },
  { day: "Sex", value: 180 },
  { day: "Sáb", value: 90 },
  { day: "Dom", value: 60 },
];

const deliveryVsPendingData: DeliveryRegionData[] = [
  { region: "Norte", completed: 450, pending: 20 },
  { region: "Sul", completed: 320, pending: 15 },
  { region: "Leste", completed: 280, pending: 10 },
  { region: "Oeste", completed: 190, pending: 5 },
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
          <IconButton icon={Filter} title="Filtros" />
          <IconButton icon={RefreshCw} title="Atualizar" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Entregas Hoje"
          value="1.284"
          icon={Truck}
          variant="primary"
          trend={{ value: "+12%", direction: "up" }}
        />
        <MetricCard
          label="Em Trânsito"
          value="342"
          icon={Clock}
          variant="secondary"
          trend={{ value: "+5%", direction: "up" }}
        />
        <MetricCard
          label="Concluídas"
          value="892"
          icon={CheckCircle}
          variant="success"
          trend={{ value: "+18%", direction: "up" }}
        />
        <MetricCard
          label="Pendentes"
          value="50"
          icon={AlertCircle}
          variant="warning"
          trend={{ value: "-2%", direction: "down" }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Performance Semanal"
          data={weeklyPerformanceData}
          dataKey="value"
          xAxisKey="day"
        />
        <BarChart
          title="Entregas vs Pendências"
          data={deliveryVsPendingData}
          xAxisKey="region"
          series={[
            { key: "completed", name: "Concluídas", color: "#1A1A1A" },
            { key: "pending", name: "Pendentes", color: "#D1D5DB" },
          ]}
        />
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
