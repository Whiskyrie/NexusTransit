/**
 * IncidentsPage - Página de Gerenciamento de Incidentes
 * Arquitetura: Clean Architecture + Atomic Design
 *
 * Bounded Context: Incident Management
 * Use Case: Visualização e gerenciamento multi-contexto através de tabs
 */

import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/shared/components/molecules";
import { TabsWithContent } from "@/shared/components/organisms";
import {
  IncidentsListTab,
  IncidentsStatsTab,
  IncidentsWebhooksTab,
} from "@/features/incidents/components";

export function IncidentsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Incidentes"
        description="Gerenciamento de incidentes operacionais"
        icon={AlertTriangle}
        iconColor="error"
      />

      {/* Tabs */}
      <TabsWithContent
        defaultTab="list"
        tabs={[
          {
            id: "list",
            label: "Incidentes",
            content: <IncidentsListTab />,
          },
          {
            id: "stats",
            label: "Estatísticas",
            content: <IncidentsStatsTab />,
          },
          {
            id: "webhooks",
            label: "Webhooks",
            content: <IncidentsWebhooksTab />,
          },
        ]}
      />
    </div>
  );
}
