/**
 * Badge para exibir status de incidente
 */

import { memo } from "react";
import { FileText, Search, PlayCircle, CheckCircle, XCircle, ArrowUpCircle } from "lucide-react";
import { IncidentStatus, IncidentStatusLabels } from "../../types/incident.types";

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  IncidentStatus,
  {
    bg: string;
    text: string;
    icon: typeof FileText;
  }
> = {
  [IncidentStatus.REPORTED]: {
    bg: "#F3F4F6",
    text: "#374151",
    icon: FileText,
  },
  [IncidentStatus.INVESTIGATING]: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    icon: Search,
  },
  [IncidentStatus.IN_PROGRESS]: {
    bg: "#FEF3C7",
    text: "#92400E",
    icon: PlayCircle,
  },
  [IncidentStatus.RESOLVED]: {
    bg: "#D1FAE5",
    text: "#065F46",
    icon: CheckCircle,
  },
  [IncidentStatus.CLOSED]: {
    bg: "#E5E7EB",
    text: "#1F2937",
    icon: XCircle,
  },
  [IncidentStatus.ESCALATED]: {
    bg: "#FEE2E2",
    text: "#991B1B",
    icon: ArrowUpCircle,
  },
};

export const IncidentStatusBadge = memo(function IncidentStatusBadge({
  status,
  showIcon = true,
  className = "",
}: IncidentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const label = IncidentStatusLabels[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
      {label}
    </span>
  );
});
