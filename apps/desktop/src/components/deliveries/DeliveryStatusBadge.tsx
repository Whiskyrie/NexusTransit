import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  PackageCheck,
  CircleOff,
  CircleDashed,
} from "lucide-react";
import type { DeliveryStatus } from "../../types/delivery.types";

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<
  DeliveryStatus,
  {
    bg: string;
    text: string;
    dot: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  PENDING: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
    label: "Pendente",
    icon: Clock,
  },
  ASSIGNED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Atribuído",
    icon: Package,
  },
  PICKED_UP: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    label: "Coletado",
    icon: PackageCheck,
  },
  IN_TRANSIT: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Em Trânsito",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    label: "Saiu para Entrega",
    icon: Truck,
  },
  DELIVERED: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Entregue",
    icon: CheckCircle,
  },
  FAILED: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Falhou",
    icon: XCircle,
  },
  CANCELLED: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Cancelado",
    icon: CircleOff,
  },
};

export function DeliveryStatusBadge({ status, size = "md" }: DeliveryStatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
    label: status,
    icon: CircleDashed,
  };

  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full w-fit whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      <Icon className={`${iconSize} ${config.text} shrink-0`} strokeWidth={2} />
      <span className={`font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}
