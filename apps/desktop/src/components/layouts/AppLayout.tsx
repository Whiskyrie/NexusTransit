import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

/**
 * Layout principal da aplicação com Sidebar colapsável
 *
 * Fornece navegação lateral e área de conteúdo para páginas internas
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F5F0] p-4 gap-4 overflow-hidden font-sans">
      {/* Sidebar colapsável */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        className="bg-white"
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto rounded-[20px] bg-[#F5F5F0] relative">
        <div className="max-w-360 mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
