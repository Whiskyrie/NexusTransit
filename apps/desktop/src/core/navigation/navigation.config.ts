/**
 * Navigation Configuration
 * Configuração centralizada da navegação (DDD - Domain)
 */

import {
  Home,
  Package,
  Route,
  MapPin,
  AlertTriangle,
  Wrench,
  Users,
  UserCircle,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export interface NavItemConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: number;
  alert?: boolean;
}

export interface NavSectionConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
  defaultOpen?: boolean;
}

/**
 * Estrutura de navegação principal
 * Organizada em seções lógicas (DDD - Bounded Contexts)
 */
export const navigationConfig: NavSectionConfig[] = [
  // Seção Principal
  {
    id: "main",
    title: "Principal",
    defaultOpen: true,
    items: [
      {
        id: "dashboard",
        icon: Home,
        label: "Dashboard",
        to: "/dashboard",
      },
      {
        id: "tracking",
        icon: MapPin,
        label: "Rastreamento",
        to: "/tracking",
      },
    ],
  },

  // Seção Operações
  {
    id: "operations",
    title: "Operações",
    defaultOpen: true,
    items: [
      {
        id: "deliveries",
        icon: Package,
        label: "Entregas",
        to: "/deliveries",
      },
      {
        id: "routes",
        icon: Route,
        label: "Rotas",
        to: "/routes",
      },
    ],
  },

  // Seção Gestão
  {
    id: "management",
    title: "Gestão",
    defaultOpen: true,
    items: [
      {
        id: "incidents",
        icon: AlertTriangle,
        label: "Incidentes",
        to: "/incidents",
      },
      {
        id: "service-orders",
        icon: Wrench,
        label: "Ordens de Serviço",
        to: "/service-orders",
      },
    ],
  },

  // Seção Cadastros
  {
    id: "cadastros",
    title: "Cadastros",
    defaultOpen: false,
    items: [
      {
        id: "customers",
        icon: UserCircle,
        label: "Clientes",
        to: "/customers",
      },
      {
        id: "drivers",
        icon: Users,
        label: "Motoristas",
        to: "/drivers",
      },
      {
        id: "vehicles",
        icon: Truck,
        label: "Veículos",
        to: "/vehicles",
      },
      {
        id: "users",
        icon: Users,
        label: "Usuários",
        to: "/users",
      },
    ],
  },

  // Seção Relatórios
  {
    id: "reports",
    title: "Relatórios",
    defaultOpen: false,
    items: [
      {
        id: "analytics",
        icon: BarChart3,
        label: "Análises",
        to: "/analytics",
      },
    ],
  },
];

/**
 * Configuração do menu de rodapé
 */
export const footerNavConfig: NavItemConfig[] = [
  {
    id: "settings",
    icon: Settings,
    label: "Configurações",
    to: "/settings",
  },
  {
    id: "logout",
    icon: LogOut,
    label: "Sair",
    to: "/logout",
  },
];
