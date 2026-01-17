import { RoutePriority } from "../../types/route.types";

interface RoutePriorityBadgeProps {
  priority: RoutePriority;
}

const priorityConfig: Record<
  RoutePriority,
  { label: string; bg: string; text: string; icon: string }
> = {
  [RoutePriority.LOW]: {
    label: "Baixa",
    bg: "bg-[#F3F4F6]",
    text: "text-[#6B7280]",
    icon: "↓",
  },
  [RoutePriority.MEDIUM]: {
    label: "Média",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    icon: "→",
  },
  [RoutePriority.HIGH]: {
    label: "Alta",
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    icon: "↑",
  },
  [RoutePriority.URGENT]: {
    label: "Urgente",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    icon: "↑↑",
  },
};

export function RoutePriorityBadge({ priority }: RoutePriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg}`}>
      <span className={`text-xs font-semibold ${config.text}`}>{config.icon}</span>
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}
