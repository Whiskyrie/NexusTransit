import { CheckCircle, XCircle, Ban, Calendar, User } from "lucide-react";
import { DriverStatus } from "../../types/driver.types";

interface DriverStatusBadgeProps {
  status: DriverStatus;
}

const statusConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  [DriverStatus.ACTIVE]: {
    label: "Ativo",
    icon: CheckCircle,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    iconColor: "text-green-500",
  },
  [DriverStatus.INACTIVE]: {
    label: "Inativo",
    icon: XCircle,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    iconColor: "text-gray-500",
  },
  [DriverStatus.SUSPENDED]: {
    label: "Suspenso",
    icon: Ban,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    iconColor: "text-red-500",
  },
  [DriverStatus.ON_LEAVE]: {
    label: "De Férias",
    icon: Calendar,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
  },
  [DriverStatus.BLOCKED]: {
    label: "Bloqueado",
    icon: Ban,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    iconColor: "text-red-500",
  },
  // Valores legados (lowercase)
  [DriverStatus.AVAILABLE]: {
    label: "Disponível",
    icon: CheckCircle,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    iconColor: "text-green-500",
  },
  [DriverStatus.ON_ROUTE]: {
    label: "Em Rota",
    icon: CheckCircle,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
  },
  [DriverStatus.UNAVAILABLE]: {
    label: "Indisponível",
    icon: XCircle,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    iconColor: "text-gray-500",
  },
  [DriverStatus.BLOCKED_LEGACY]: {
    label: "Bloqueado",
    icon: Ban,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    iconColor: "text-red-500",
  },
  [DriverStatus.VACATION]: {
    label: "Férias",
    icon: Calendar,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
  },
};

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    icon: User,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    iconColor: "text-gray-500",
  };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bgColor}`}>
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  );
}
