import type { DeliveryPriority } from "../../types/delivery.types";

interface DeliveryPriorityBadgeProps {
  priority: DeliveryPriority;
  size?: "sm" | "md";
}

const priorityConfig: Record<
  DeliveryPriority,
  {
    bg: string;
    text: string;
    label: string;
  }
> = {
  LOW: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Baixa",
  },
  NORMAL: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Normal",
  },
  HIGH: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    label: "Alta",
  },
  CRITICAL: {
    bg: "bg-red-100",
    text: "text-red-600",
    label: "Crítica",
  },
};

export function DeliveryPriorityBadge({ priority, size = "md" }: DeliveryPriorityBadgeProps) {
  const config = priorityConfig[priority] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: priority,
  };

  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span className={`rounded font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
