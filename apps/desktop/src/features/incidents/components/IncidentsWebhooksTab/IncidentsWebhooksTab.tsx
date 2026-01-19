/**
 * IncidentsWebhooksTab Component
 * Gerenciamento de webhooks de incidentes
 */

import { Card, CardHeader, CardBody } from "@/shared/components/atoms";
import { Webhook } from "lucide-react";

export function IncidentsWebhooksTab() {
  return (
    <div className="space-y-6">
      <Card variant="bordered" padding="lg">
        <CardHeader title="Webhooks de Incidentes" subtitle="Configure integrações automáticas" />
        <CardBody>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <Webhook className="w-8 h-8 text-purple-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              A API de webhooks já está implementada no backend. Em breve você poderá configurar
              webhooks para receber notificações automáticas sobre incidentes.
            </p>
            <div className="mt-6 text-xs text-gray-400">
              <p>Endpoints disponíveis:</p>
              <code className="mt-2 block bg-gray-50 px-3 py-1 rounded">
                GET /api/incidents/webhooks
                <br />
                POST /api/incidents/webhooks
                <br />
                PATCH /api/incidents/webhooks/:id
                <br />
                DELETE /api/incidents/webhooks/:id
              </code>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
