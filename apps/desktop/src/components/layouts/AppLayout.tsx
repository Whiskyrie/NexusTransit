import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Truck, UserCircle, MapPin, LogOut } from "lucide-react";
import { useAuthStore, useUser } from "../../stores/auth.store";

/**
 * Layout principal da aplicação com Sidebar
 *
 * Fornece navegação lateral e área de conteúdo para páginas internas
 */
export function AppLayout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/users", icon: Users, label: "Usuários" },
    { path: "/drivers", icon: UserCircle, label: "Motoristas" },
    { path: "/vehicles", icon: Truck, label: "Veículos" },
    { path: "/routes", icon: MapPin, label: "Rotas" },
    // { path: "/orders", icon: Package, label: "Pedidos" }, // TODO: Implementar
    // { path: "/tracking", icon: MapPin, label: "Rastreamento" }, // TODO: Implementar
    // { path: "/reports", icon: FileText, label: "Relatórios" }, // TODO: Implementar
    // { path: "/settings", icon: Settings, label: "Configurações" }, // TODO: Implementar
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F0] p-4 gap-4 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-70 bg-white rounded-[20px] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 px-2">
            <img src="/nexus.svg" alt="Nexus Transit" className="h-8 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#000000] text-white shadow-md"
                        : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-medium text-[14px]">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 mt-auto">
          <div className="bg-[#F5F5F0] rounded-xl p-4 mb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-lg font-bold text-gray-600">
                {user?.first_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-[#6B6B6B] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-[#1A1A1A] text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto rounded-[20px] bg-[#F5F5F0] relative">
        <div className="max-w-360 mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
