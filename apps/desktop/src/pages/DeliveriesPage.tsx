/**
 * DeliveriesPage - Página de Gerenciamento de Entregas
 * Arquitetura: Clean Architecture + Atomic Design
 *
 * Bounded Context: Delivery Management
 * Use Case: Visualização e gerenciamento multi-contexto através de tabs
 */

import { Package } from "lucide-react";
import { PageHeader } from "@/shared/components/molecules";
import { TabsWithContent } from "@/shared/components/organisms";
import {
  DeliveriesListTab,
  DeliveriesStatsTab,
  DeliveriesMapTab,
} from "@/features/deliveries/components";

export function DeliveriesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Entregas"
        description="Gerenciamento de entregas e logística"
        icon={Package}
        iconColor="primary"
      />

      {/* Tabs */}
      <TabsWithContent
        defaultTab="list"
        tabs={[
          {
            id: "list",
            label: "Entregas",
            content: <DeliveriesListTab />,
          },
          {
            id: "stats",
            label: "Estatísticas",
            content: <DeliveriesStatsTab />,
          },
          {
            id: "map",
            label: "Mapa",
            content: <DeliveriesMapTab />,
          },
        ]}
      />
    </div>
  );
}
