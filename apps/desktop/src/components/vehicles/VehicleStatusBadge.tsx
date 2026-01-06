import { VehicleStatus } from "../../types/vehicle.types";
import { CheckCircle, Truck, Wrench, Ban, HelpCircle, LucideIcon } from "lucide-react";

interface VehicleStatusBadgeProps {
  status: VehicleStatus | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig: Record<
  string,
  {
    label: string;
    bg: string;
    textColor: string;
    iconColor: string;
    icon: LucideIcon;
  }
> = {
  [VehicleStatus.ACTIVE]: {
    label: "Ativo",
    bg: "bg-emerald-100",
    textColor: "text-emerald-800",
    iconColor: "text-emerald-600",
    icon: CheckCircle,
  },
  [VehicleStatus.INACTIVE]: {
    label: "Inativo",
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    iconColor: "text-gray-600",
    icon: Ban,
  },
  [VehicleStatus.IN_ROUTE]: {
    label: "Em Rota",
    bg: "bg-blue-100",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
    icon: Truck,
  },
  [VehicleStatus.MAINTENANCE]: {
    label: "Manutenção",
    bg: "bg-amber-100",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
    icon: Wrench,
  },
  [VehicleStatus.OUT_OF_SERVICE]: {
    label: "Fora de Serviço",
    bg: "bg-red-100",
    textColor: "text-red-800",
    iconColor: "text-red-600",
    icon: Ban,
  },
};

const sizeClasses = {
  sm: {
    badge: "px-2.5 py-0.5 text-xs gap-1",
    icon: "w-3 h-3",
  },
  md: {
    badge: "px-3 py-1 text-sm gap-1.5",
    icon: "w-3.5 h-3.5",
  },
  lg: {
    badge: "px-4 py-1.5 text-base gap-2",
    icon: "w-4 h-4",
  },
};

export function VehicleStatusBadge({
  status,
  size = "sm",
  showLabel = true,
}: VehicleStatusBadgeProps) {
  // Validar se o status existe no config
  const config = statusConfig[status] || {
    label: String(status),
    bg: "bg-gray-100",
    textColor: "text-gray-800",
    iconColor: "text-gray-600",
    icon: HelpCircle,
  };
  const sizes = sizeClasses[size];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizes.badge} ${config.bg} ${config.textColor} rounded-full font-medium`}
    >
      <Icon className={`${sizes.icon} ${config.iconColor}`} strokeWidth={2} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
