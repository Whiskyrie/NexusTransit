import { RouteStatus } from "../../types/route.types";
import { Clock, Truck, PauseCircle, PackageCheck, Ban, LucideIcon } from "lucide-react";

interface RouteStatusBadgeProps {
  status: RouteStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig: Record<
  RouteStatus,
  {
    label: string;
    bg: string;
    iconColor: string;
    icon: LucideIcon;
  }
> = {
  [RouteStatus.PLANNED]: {
    label: "Planejada",
    bg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: Clock,
  },
  [RouteStatus.IN_PROGRESS]: {
    label: "Em Andamento",
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: Truck,
  },
  [RouteStatus.PAUSED]: {
    label: "Pausada",
    bg: "bg-slate-200",
    iconColor: "text-slate-600",
    icon: PauseCircle,
  },
  [RouteStatus.COMPLETED]: {
    label: "Concluída",
    bg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: PackageCheck,
  },
  [RouteStatus.CANCELLED]: {
    label: "Cancelada",
    bg: "bg-red-100",
    iconColor: "text-red-600",
    icon: Ban,
  },
};

export function RouteStatusBadge({
  status,
  size = "md",
  showLabel = false,
}: RouteStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const containerSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
        <Icon className={`${iconSizes.sm} ${config.iconColor}`} strokeWidth={2} />
        <span className={`text-xs font-medium ${config.iconColor}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${containerSizes[size]} rounded-full ${config.bg}`}
      title={config.label}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor}`} strokeWidth={2} />
    </div>
  );
}
