/**
 * Badge para exibir tipo de incidente
 */

import { memo } from "react";
import {
  Car,
  Clock,
  MapPinOff,
  Navigation,
  PackageX,
  ShieldAlert,
  PackageOpen,
  CloudRain,
  AlertCircle,
} from "lucide-react";
import { IncidentType, IncidentTypeLabels } from "../../types/incident.types";

interface IncidentTypeBadgeProps {
  type: IncidentType;
  showIcon?: boolean;
  className?: string;
}

const typeConfig: Record<
  IncidentType,
  {
    bg: string;
    text: string;
    icon: typeof Car;
  }
> = {
  [IncidentType.TRAFFIC_ACCIDENT]: {
    bg: "#FEE2E2",
    text: "#991B1B",
    icon: Car,
  },
  [IncidentType.VEHICLE_BREAKDOWN]: {
    bg: "#FED7AA",
    text: "#9A3412",
    icon: AlertCircle,
  },
  [IncidentType.DELAYED_TRAFFIC]: {
    bg: "#FEF3C7",
    text: "#92400E",
    icon: Clock,
  },
  [IncidentType.CUSTOMER_NOT_FOUND]: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    icon: MapPinOff,
  },
  [IncidentType.WRONG_ADDRESS]: {
    bg: "#E0E7FF",
    text: "#3730A3",
    icon: Navigation,
  },
  [IncidentType.REFUSED_DELIVERY]: {
    bg: "#FCE7F3",
    text: "#9F1239",
    icon: PackageX,
  },
  [IncidentType.THEFT]: {
    bg: "#FEE2E2",
    text: "#7F1D1D",
    icon: ShieldAlert,
  },
  [IncidentType.DAMAGE]: {
    bg: "#FFEDD5",
    text: "#9A3412",
    icon: PackageOpen,
  },
  [IncidentType.WEATHER]: {
    bg: "#DBEAFE",
    text: "#1E3A8A",
    icon: CloudRain,
  },
  [IncidentType.OTHER]: {
    bg: "#F3F4F6",
    text: "#374151",
    icon: AlertCircle,
  },
};

export const IncidentTypeBadge = memo(function IncidentTypeBadge({
  type,
  showIcon = true,
  className = "",
}: IncidentTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const label = IncidentTypeLabels[type];

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
