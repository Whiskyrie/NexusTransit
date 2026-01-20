import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/components/organisms";

/**
 * Layout principal da aplicação
 * Refatorado com Clean Architecture + Design System
 *
 * Features:
 * - Sidebar minimalista com seções colapsáveis
 * - Tipografia Inter (Linear-style)
 * - Design tokens centralizados
 */
export function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden">
      {/* Sidebar Refatorada */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F5F5F0] p-6">
        <Outlet />
      </main>
    </div>
  );
}
