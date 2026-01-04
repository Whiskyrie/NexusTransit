import { RouteStatus } from "../../types/route.types";

interface RouteStatusBadgeProps {
  status: RouteStatus;
}

const statusConfig: Record<RouteStatus, { label: string; bg: string; text: string; dot: string }> =
  {
    [RouteStatus.PENDING]: {
      label: "Pendente",
      bg: "bg-[#FEF3C7]",
      text: "text-[#D97706]",
      dot: "bg-[#F59E0B]",
    },
    [RouteStatus.IN_PROGRESS]: {
      label: "Em Andamento",
      bg: "bg-[#EFF6FF]",
      text: "text-[#2563EB]",
      dot: "bg-[#3B82F6]",
    },
    [RouteStatus.PAUSED]: {
      label: "Pausada",
      bg: "bg-[#F3F4F6]",
      text: "text-[#6B7280]",
      dot: "bg-[#9CA3AF]",
    },
    [RouteStatus.COMPLETED]: {
      label: "Concluída",
      bg: "bg-[#ECFDF5]",
      text: "text-[#059669]",
      dot: "bg-[#10B981]",
    },
    [RouteStatus.CANCELLED]: {
      label: "Cancelada",
      bg: "bg-[#FEF2F2]",
      text: "text-[#DC2626]",
      dot: "bg-[#EF4444]",
    },
  };

export function RouteStatusBadge({ status }: RouteStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}
