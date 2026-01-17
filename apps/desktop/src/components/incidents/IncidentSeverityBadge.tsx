/**
 * Badge para exibir severidade de incidente
 */

import { memo } from "react";
import { AlertTriangle, AlertCircle, AlertOctagon, Flame } from "lucide-react";
import { IncidentSeverity, IncidentSeverityLabels } from "../../types/incident.types";

interface IncidentSeverityBadgeProps {
  severity: IncidentSeverity;
  showIcon?: boolean;
  className?: string;
}

const severityConfig: Record<
  IncidentSeverity,
  {
    bg: string;
    text: string;
    icon: typeof AlertCircle;
  }
> = {
  [IncidentSeverity.LOW]: {
    bg: "#ECFDF5",
    text: "#065F46",
    icon: AlertCircle,
  },
  [IncidentSeverity.MEDIUM]: {
    bg: "#FEF3C7",
    text: "#92400E",
    icon: AlertTriangle,
  },
  [IncidentSeverity.HIGH]: {
    bg: "#FED7AA",
    text: "#9A3412",
    icon: AlertOctagon,
  },
  [IncidentSeverity.CRITICAL]: {
    bg: "#FEE2E2",
    text: "#991B1B",
    icon: Flame,
  },
};

export const IncidentSeverityBadge = memo(function IncidentSeverityBadge({
  severity,
  showIcon = true,
  className = "",
}: IncidentSeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;
  const label = IncidentSeverityLabels[severity];

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
