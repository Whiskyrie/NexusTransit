import { Shield, User, Users, Settings, Briefcase } from "lucide-react";
import type { User as UserType } from "../../types/user.types";

interface UserTypeBadgeProps {
  userType: UserType["user_type"];
}

const typeConfig: Record<
  UserType["user_type"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  admin: {
    label: "Administrador",
    icon: <Shield className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-purple-100 text-purple-800",
  },
  driver: {
    label: "Motorista",
    icon: <User className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-blue-100 text-blue-800",
  },
  customer: {
    label: "Cliente",
    icon: <Users className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-green-100 text-green-800",
  },
  operator: {
    label: "Operador",
    icon: <Settings className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-orange-100 text-orange-800",
  },
  manager: {
    label: "Gerente",
    icon: <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />,
    className: "bg-indigo-100 text-indigo-800",
  },
};

export function UserTypeBadge({ userType }: UserTypeBadgeProps) {
  const config = typeConfig[userType];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
