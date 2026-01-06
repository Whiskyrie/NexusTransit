import { CheckCircle, XCircle, Ban } from "lucide-react";
import type { User } from "../../types/user.types";

interface UserStatusBadgeProps {
  status: User["status"];
}

const statusConfig: Record<
  User["status"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  active: {
    label: "Ativo",
    icon: <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-green-100 text-green-800",
  },
  inactive: {
    label: "Inativo",
    icon: <XCircle className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-gray-100 text-gray-800",
  },
  suspended: {
    label: "Suspenso",
    icon: <Ban className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-red-100 text-red-800",
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
